class Api::ExpensesController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :show]
  before_action :set_expense, only: [:show, :update, :destroy]

  def index
    @expenses = tenant_scope(Expense).includes(:car, :expense_category).recent

    # Optional filtering by car_id
    @expenses = @expenses.for_car(params[:car_id]) if params[:car_id].present?

    render json: @expenses, include: [:car, :expense_category]
  end

  def show
    render json: @expense, include: [:car, :expense_category]
  end

  def create
    @expense = tenant_scope(Expense).new(expense_params)
    @expense.tenant = current_tenant

    if @expense.save
      render json: @expense, status: :created
    else
      render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @expense.update(expense_params)
      render json: @expense
    else
      render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @expense.destroy
    render json: { message: 'Expense deleted successfully' }
  end

  private

  def set_expense
    @expense = tenant_scope(Expense).find(params[:id])
  end

  def expense_params
    params.require(:expense).permit(:car_id, :expense_category_id, :amount, :description, :expense_date)
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
