class Api::ProjectExpensesController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_expense, only: [:show, :update, :destroy]

  def index
    expenses_scope = tenant_scope(ProjectExpense).includes(:project, :project_expense_category)

    if params[:project_id].present?
      expenses_scope = expenses_scope.for_project(params[:project_id])
    end

    @expenses = expenses_scope.all
    render json: @expenses
  end

  def show
    render json: @expense
  end

  def create
    @expense = tenant_scope(ProjectExpense).new(expense_params)
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
    head :no_content
  end

  private

  def set_expense
    @expense = tenant_scope(ProjectExpense).find(params[:id])
  end

  def expense_params
    params.require(:project_expense).permit(
      :project_id, :project_expense_category_id, :amount, :expense_date, :description
    )
  end
end
