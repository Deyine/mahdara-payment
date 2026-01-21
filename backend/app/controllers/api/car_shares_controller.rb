class Api::CarSharesController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_car_share, only: [:show, :update, :destroy]

  # GET /api/car_shares
  # Optional: ?car_id=uuid to filter by car
  def index
    shares = tenant_scope(CarShare).includes(:car, :created_by)
    shares = shares.where(car_id: params[:car_id]) if params[:car_id].present?
    shares = shares.order(created_at: :desc)

    render json: shares.map { |share| CarShareSerializer.new(share).as_json }
  end

  # GET /api/car_shares/:id
  def show
    render json: CarShareSerializer.new(@car_share).as_json
  end

  # POST /api/car_shares
  def create
    @car_share = CarShare.new(car_share_params)
    @car_share.tenant = current_tenant
    @car_share.created_by = current_user

    if @car_share.save
      render json: CarShareSerializer.new(@car_share).as_json, status: :created
    else
      render json: { errors: @car_share.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PUT /api/car_shares/:id
  def update
    if @car_share.update(car_share_params)
      render json: CarShareSerializer.new(@car_share).as_json
    else
      render json: { errors: @car_share.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/car_shares/:id
  def destroy
    @car_share.destroy
    render json: { message: 'Lien de partage supprimé' }
  end

  private

  def set_car_share
    @car_share = tenant_scope(CarShare).find(params[:id])
  end

  def car_share_params
    params.require(:car_share).permit(:car_id, :show_costs, :show_expenses, :expires_at)
  end
end
