class Api::PaymentMethodsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :active]
  before_action :set_payment_method, only: [:show, :update, :destroy]

  def index
    payment_methods = tenant_scope(PaymentMethod).all
    render json: payment_methods.map { |pm| PaymentMethodSerializer.new(pm).as_json }
  end

  def active
    payment_methods = tenant_scope(PaymentMethod).active
    render json: payment_methods.map { |pm| PaymentMethodSerializer.new(pm).as_json }
  end

  def show
    render json: PaymentMethodSerializer.new(@payment_method).as_json
  end

  def create
    @payment_method = tenant_scope(PaymentMethod).new(payment_method_params)
    @payment_method.tenant = current_tenant

    if @payment_method.save
      render json: PaymentMethodSerializer.new(@payment_method).as_json, status: :created
    else
      render json: { errors: @payment_method.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @payment_method.update(payment_method_params)
      render json: PaymentMethodSerializer.new(@payment_method).as_json
    else
      render json: { errors: @payment_method.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @payment_method.destroy
    render json: { message: 'Payment method deleted successfully' }
  rescue ActiveRecord::InvalidForeignKey
    render json: { error: 'Cannot delete payment method: it has associated payments' }, status: :unprocessable_entity
  end

  private

  def set_payment_method
    @payment_method = tenant_scope(PaymentMethod).find(params[:id])
  end

  def payment_method_params
    params.require(:payment_method).permit(:name, :active)
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
