class Api::ProjectsController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_project, only: [:show, :update, :destroy]

  def index
    @projects = tenant_scope(Project).includes(:project_expenses).all
    render json: @projects
  end

  def active
    @projects = tenant_scope(Project).active
    render json: @projects
  end

  def show
    render json: @project
  end

  def create
    @project = tenant_scope(Project).new(project_params)
    @project.tenant = current_tenant

    if @project.save
      render json: @project, status: :created
    else
      render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @project.update(project_params)
      render json: @project
    else
      render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @project.project_expenses.exists?
      render json: { error: 'Impossible de supprimer un projet avec des dépenses existantes' },
             status: :unprocessable_entity
    else
      @project.destroy
      head :no_content
    end
  end

  private

  def set_project
    @project = tenant_scope(Project).find(params[:id])
  end

  def project_params
    params.require(:project).permit(:name, :description, :active)
  end
end
