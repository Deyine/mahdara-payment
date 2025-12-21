class Api::ExpenseCategoriesController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :active]
  before_action :set_expense_category, only: [:show, :update, :destroy]

  def index
    @expense_categories = tenant_scope(ExpenseCategory).all
    render json: @expense_categories
  end

  def active
    @expense_categories = tenant_scope(ExpenseCategory).active
    render json: @expense_categories
  end

  def show
    render json: @expense_category
  end

  def create
    @expense_category = tenant_scope(ExpenseCategory).new(expense_category_params)
    @expense_category.tenant = current_tenant

    if @expense_category.save
      render json: @expense_category, status: :created
    else
      render json: { errors: @expense_category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @expense_category.update(expense_category_params)
      render json: @expense_category
    else
      render json: { errors: @expense_category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @expense_category.expenses.exists?
      render json: { error: 'Cannot delete expense category with associated expenses' }, status: :unprocessable_entity
    else
      @expense_category.destroy
      head :no_content
    end
  end

  private

  def set_expense_category
    @expense_category = tenant_scope(ExpenseCategory).find(params[:id])
  end

  def expense_category_params
    params.require(:expense_category).permit(:name, :expense_type, :active)
  end

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
