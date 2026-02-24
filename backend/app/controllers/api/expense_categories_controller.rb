class Api::ExpenseCategoriesController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :active]
  before_action :set_expense_category, only: [:show, :update, :destroy, :stats]

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

  def stats
    rows = tenant_scope(Expense)
      .unscope(:order)
      .joins(car: :car_model)
      .where(expense_category_id: @expense_category.id)
      .where(cars: { deleted_at: nil })
      .group('car_models.id', 'car_models.name', 'cars.year')
      .order('car_models.name ASC', 'cars.year DESC')
      .select(
        'car_models.id as cm_id',
        'car_models.name as cm_name',
        'cars.year as car_year',
        'COUNT(expenses.id) as count',
        'AVG(expenses.amount) as average_amount',
        'MIN(expenses.amount) as min_amount',
        'MAX(expenses.amount) as max_amount',
        'SUM(expenses.amount) as total_amount'
      )

    stats = rows.map do |row|
      {
        car_model: { id: row.cm_id, name: row.cm_name, year: row.car_year.to_i },
        count: row.count.to_i,
        average_amount: row.average_amount.to_f.round(2),
        min_amount: row.min_amount.to_f.round(2),
        max_amount: row.max_amount.to_f.round(2),
        total_amount: row.total_amount.to_f.round(2)
      }
    end

    render json: {
      category: {
        id: @expense_category.id,
        name: @expense_category.name,
        expense_type: @expense_category.expense_type
      },
      stats: stats
    }
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
