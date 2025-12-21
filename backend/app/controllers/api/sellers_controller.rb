class Api::SellersController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :active]
  before_action :set_seller, only: [:show, :update, :destroy]

  def index
    @sellers = tenant_scope(Seller).all
    render json: @sellers
  end

  def active
    @sellers = tenant_scope(Seller).active
    render json: @sellers
  end

  def show
    render json: @seller
  end

  def create
    @seller = tenant_scope(Seller).new(seller_params)
    @seller.tenant = current_tenant

    if @seller.save
      render json: @seller, status: :created
    else
      render json: { errors: @seller.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @seller.update(seller_params)
      render json: @seller
    else
      render json: { errors: @seller.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @seller.cars.exists?
      render json: { error: 'Cannot delete seller with associated cars' }, status: :unprocessable_entity
    else
      @seller.destroy
      head :no_content
    end
  end

  private

  def set_seller
    @seller = tenant_scope(Seller).find(params[:id])
  end

  def seller_params
    params.require(:seller).permit(:name, :location, :active)
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
