class Api::RentalTransactionsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :show]
  before_action :set_rental_transaction, only: [:show, :update, :destroy]

  def index
    # Support filtering by car_id
    rentals_scope = tenant_scope(RentalTransaction).includes(:car, :profit_share_user)

    if params[:car_id].present?
      rentals_scope = rentals_scope.for_car(params[:car_id])
    end

    @rental_transactions = rentals_scope.recent
    render json: @rental_transactions.map { |rental| RentalTransactionSerializer.new(rental).as_json }
  end

  def show
    render json: RentalTransactionSerializer.new(@rental_transaction).as_json
  end

  def create
    @rental_transaction = tenant_scope(RentalTransaction).new(rental_transaction_params)
    @rental_transaction.tenant = current_tenant

    if @rental_transaction.save
      render json: RentalTransactionSerializer.new(@rental_transaction).as_json, status: :created
    else
      render json: { errors: @rental_transaction.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @rental_transaction.update(rental_transaction_params)
      render json: RentalTransactionSerializer.new(@rental_transaction).as_json
    else
      render json: { errors: @rental_transaction.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @rental_transaction.destroy
    render json: { message: 'Rental transaction deleted successfully' }
  end

  private

  def set_rental_transaction
    @rental_transaction = tenant_scope(RentalTransaction).find(params[:id])
  end

  def rental_transaction_params
    params.require(:rental_transaction).permit(
      :car_id, :locataire, :rental_date, :days, :daily_rate, :notes,
      :profit_share_user_id, :profit_per_day
    )
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
