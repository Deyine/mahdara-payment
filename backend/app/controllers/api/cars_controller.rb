class Api::CarsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :show, :add_salvage_photos, :delete_salvage_photo, :add_after_repair_photos, :delete_after_repair_photo, :add_invoices, :delete_invoice]
  before_action :set_car, only: [:show, :update, :destroy, :sell, :unsell, :add_salvage_photos, :delete_salvage_photo, :add_after_repair_photos, :delete_after_repair_photo, :add_invoices, :delete_invoice]
  before_action :set_car_with_deleted, only: [:restore]

  def index
    # Support showing deleted cars via query parameter
    cars_scope = tenant_scope(Car)

    # Apply appropriate scope based on query parameters
    if params[:include_deleted] == 'true'
      # Show all cars (active + deleted)
      cars_scope = cars_scope
    elsif params[:only_deleted] == 'true'
      # Show only deleted cars
      cars_scope = cars_scope.deleted
    else
      # Default: show only active (non-deleted) cars
      cars_scope = cars_scope.active
    end

    @cars = cars_scope.includes(:car_model, :expenses, :seller).recent
    render json: @cars.map { |car| CarSerializer.new(car).as_json }
  end

  def show
    render json: CarSerializer.new(@car).as_json
  end

  def create
    @car = tenant_scope(Car).new(car_params)
    @car.tenant = current_tenant

    if @car.save
      render json: CarSerializer.new(@car).as_json, status: :created
    else
      render json: { errors: @car.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @car.update(car_params)
      render json: CarSerializer.new(@car).as_json
    else
      render json: { errors: @car.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    # Soft delete - always use soft deletion regardless of expenses
    if @car.soft_delete!
      render json: { message: 'Car deleted successfully' }
    else
      render json: { error: 'Error deleting car' }, status: :unprocessable_entity
    end
  end

  def restore
    if @car.restore!
      render json: { message: 'Car restored successfully', car: CarSerializer.new(@car).as_json }
    else
      render json: { error: 'Error restoring car' }, status: :unprocessable_entity
    end
  end

  # Add salvage photos (operators can access)
  def add_salvage_photos
    if params[:photos].present?
      @car.salvage_photos.attach(params[:photos])

      if @car.save
        render json: CarSerializer.new(@car).as_json
      else
        render json: { errors: @car.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'No photos provided' }, status: :unprocessable_entity
    end
  end

  # Delete a specific salvage photo (operators can access)
  def delete_salvage_photo
    photo = @car.salvage_photos.find(params[:photo_id])
    photo.purge
    render json: { message: 'Photo deleted successfully' }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Photo not found' }, status: :not_found
  end

  # Add after-repair photos (operators can access)
  def add_after_repair_photos
    if params[:photos].present?
      @car.after_repair_photos.attach(params[:photos])

      if @car.save
        render json: CarSerializer.new(@car).as_json
      else
        render json: { errors: @car.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'No photos provided' }, status: :unprocessable_entity
    end
  end

  # Delete a specific after-repair photo (operators can access)
  def delete_after_repair_photo
    photo = @car.after_repair_photos.find(params[:photo_id])
    photo.purge
    render json: { message: 'Photo deleted successfully' }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Photo not found' }, status: :not_found
  end

  # Add invoices (operators can access)
  def add_invoices
    if params[:invoices].present?
      @car.invoices.attach(params[:invoices])

      if @car.save
        render json: CarSerializer.new(@car).as_json
      else
        render json: { errors: @car.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'No invoices provided' }, status: :unprocessable_entity
    end
  end

  # Delete a specific invoice (operators can access)
  def delete_invoice
    invoice = @car.invoices.find(params[:invoice_id])
    invoice.purge
    render json: { message: 'Invoice deleted successfully' }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Invoice not found' }, status: :not_found
  end

  # Mark car as sold (admin only)
  def sell
    sale_price = params[:sale_price]
    sale_date = params[:sale_date] || Date.current

    if sale_price.blank? || sale_price.to_f <= 0
      render json: { error: 'Sale price must be greater than 0' }, status: :unprocessable_entity
      return
    end

    if @car.mark_as_sold!(sale_price, sale_date)
      render json: {
        message: 'Car marked as sold successfully',
        car: CarSerializer.new(@car.reload).as_json
      }
    else
      render json: { errors: @car.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # Revert car to active status (admin only)
  def unsell
    if @car.mark_as_available!
      render json: {
        message: 'Car marked as available successfully',
        car: CarSerializer.new(@car.reload).as_json
      }
    else
      render json: { error: 'Cannot mark as available: car has payments recorded' }, status: :unprocessable_entity
    end
  end

  private

  def set_car
    @car = tenant_scope(Car).active.find(params[:id])
  end

  def set_car_with_deleted
    @car = tenant_scope(Car).find(params[:id])
  end

  def car_params
    params.require(:car).permit(
      :vin, :ref, :car_model_id, :year, :color, :mileage,
      :purchase_date, :purchase_price, :seller_id,
      :clearance_cost, :towing_cost,
      salvage_photos: [],
      after_repair_photos: [],
      invoices: []
    )
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
