class Api::TenantsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_super_admin
  before_action :set_tenant, only: [:show, :update, :destroy]

  def index
    @tenants = Tenant.all.order(:name)
    render json: @tenants
  end

  def show
    render json: @tenant
  end

  def create
    @tenant = Tenant.new(tenant_params)

    if @tenant.save
      render json: @tenant, status: :created
    else
      render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @tenant.update(tenant_params)
      render json: @tenant
    else
      render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @tenant.users.exists? || @tenant.cars.exists?
      render json: { error: 'Cannot delete tenant with existing users or data' }, status: :unprocessable_entity
    else
      @tenant.destroy
      head :no_content
    end
  end

  private

  def set_tenant
    @tenant = Tenant.find(params[:id])
  end

  def tenant_params
    params.require(:tenant).permit(:name, :subdomain, :active)
  end

  def require_super_admin
    unless current_user&.super_admin?
      render json: { error: 'Forbidden - Super Admin access required' }, status: :forbidden
    end
  end
end
