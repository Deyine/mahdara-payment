class Api::PaymentsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :show]
  before_action :set_payment, only: [:show, :update, :destroy]

  def index
    # Support filtering by car_id
    payments_scope = tenant_scope(Payment).includes(:car, :payment_method)

    if params[:car_id].present?
      payments_scope = payments_scope.for_car(params[:car_id])
    end

    @payments = payments_scope.recent
    render json: @payments.map { |payment| PaymentSerializer.new(payment).as_json }
  end

  def show
    render json: PaymentSerializer.new(@payment).as_json
  end

  def create
    @payment = tenant_scope(Payment).new(payment_params)
    @payment.tenant = current_tenant

    if @payment.save
      render json: PaymentSerializer.new(@payment).as_json, status: :created
    else
      render json: { errors: @payment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @payment.update(payment_params)
      render json: PaymentSerializer.new(@payment).as_json
    else
      render json: { errors: @payment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @payment.destroy
    render json: { message: 'Payment deleted successfully' }
  end

  private

  def set_payment
    @payment = tenant_scope(Payment).find(params[:id])
  end

  def payment_params
    params.require(:payment).permit(
      :car_id, :amount, :payment_date, :payment_method_id, :notes
    )
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
