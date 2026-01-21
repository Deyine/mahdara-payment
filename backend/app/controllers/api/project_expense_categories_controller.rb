class Api::ProjectExpenseCategoriesController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_category, only: [:show, :update, :destroy]

  def index
    @categories = tenant_scope(ProjectExpenseCategory).all
    render json: @categories
  end

  def active
    @categories = tenant_scope(ProjectExpenseCategory).active
    render json: @categories
  end

  def show
    render json: @category
  end

  def create
    @category = tenant_scope(ProjectExpenseCategory).new(category_params)
    @category.tenant = current_tenant

    if @category.save
      render json: @category, status: :created
    else
      render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @category.update(category_params)
      render json: @category
    else
      render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @category.project_expenses.exists?
      render json: { error: 'Impossible de supprimer une catégorie avec des dépenses existantes' },
             status: :unprocessable_entity
    else
      @category.destroy
      head :no_content
    end
  end

  private

  def set_category
    @category = tenant_scope(ProjectExpenseCategory).find(params[:id])
  end

  def category_params
    params.require(:project_expense_category).permit(:name, :description, :active)
  end
end
