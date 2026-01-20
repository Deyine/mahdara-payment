class Api::CashoutsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_cashout, only: [:show, :destroy]

  def index
    # Support filtering by user_id
    cashouts_scope = tenant_scope(Cashout).includes(:user)

    if params[:user_id].present?
      cashouts_scope = cashouts_scope.for_user(params[:user_id])
    end

    @cashouts = cashouts_scope.recent
    render json: @cashouts.map { |cashout| CashoutSerializer.new(cashout).as_json }
  end

  def show
    render json: CashoutSerializer.new(@cashout).as_json
  end

  def create
    @cashout = tenant_scope(Cashout).new(cashout_params)
    @cashout.tenant = current_tenant

    if @cashout.save
      render json: CashoutSerializer.new(@cashout).as_json, status: :created
    else
      render json: { errors: @cashout.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @cashout.destroy
    render json: { message: 'Cashout deleted successfully' }
  end

  private

  def set_cashout
    @cashout = tenant_scope(Cashout).find(params[:id])
  end

  def cashout_params
    params.require(:cashout).permit(
      :user_id, :amount, :cashout_date, :notes
    )
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
