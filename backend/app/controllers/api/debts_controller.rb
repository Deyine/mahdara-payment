class Api::DebtsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_debt, only: [:show, :update, :destroy]

  def index
    debts_scope = tenant_scope(Debt).includes(:user)

    # Filter by user_id
    if params[:user_id].present?
      debts_scope = debts_scope.for_user(params[:user_id])
    end

    # Filter by direction
    if params[:direction].present?
      debts_scope = debts_scope.where(direction: params[:direction])
    end

    @debts = debts_scope.recent
    render json: @debts.map { |debt| DebtSerializer.new(debt).as_json }
  end

  def show
    render json: DebtSerializer.new(@debt).as_json
  end

  def create
    @debt = tenant_scope(Debt).new(debt_params)
    @debt.tenant = current_tenant

    if @debt.save
      render json: DebtSerializer.new(@debt).as_json, status: :created
    else
      render json: { errors: @debt.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @debt.update(debt_params)
      render json: DebtSerializer.new(@debt).as_json
    else
      render json: { errors: @debt.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @debt.destroy
    render json: { message: 'Debt deleted successfully' }
  end

  # GET /api/debts/summary - Returns totals for dashboard
  def summary
    debts = tenant_scope(Debt)

    total_we_lent = debts.we_lent.sum(:amount).to_f
    total_we_borrowed = debts.we_borrowed.sum(:amount).to_f

    render json: {
      total_we_lent: total_we_lent,
      total_we_borrowed: total_we_borrowed,
      net_balance: total_we_lent - total_we_borrowed
    }
  end

  private

  def set_debt
    @debt = tenant_scope(Debt).find(params[:id])
  end

  def debt_params
    params.require(:debt).permit(
      :debtor_name, :user_id, :direction, :amount, :debt_date, :notes
    )
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
