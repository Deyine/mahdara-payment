module Api
  module TimeTracking
    class ProjectsController < ApplicationController
      include MultiTenantable

      skip_before_action :require_car_access
      before_action -> { require_permission(:time_tracking) }
      before_action :set_project, only: [:show, :update, :destroy]
      before_action :set_project_with_deleted, only: [:restore]
      before_action :require_admin, except: [:index, :show]

      def index
        projects_scope = tenant_scope(::TimeTracking::Project)

        # Apply filters
        if params[:include_deleted] == 'true'
          projects_scope = projects_scope.unscope(where: :deleted_at)
        elsif params[:only_deleted] == 'true'
          projects_scope = projects_scope.unscope(where: :deleted_at).deleted
        else
          projects_scope = projects_scope.active
        end

        if params[:status].present?
          projects_scope = projects_scope.by_status(params[:status])
        end

        @projects = projects_scope.includes(:user, :tasks).all
        render json: @projects.map { |p| ::TimeTracking::ProjectSerializer.new(p).as_json }
      end

      def show
        render json: ::TimeTracking::ProjectSerializer.new(@project).as_json
      end

      def create
        @project = tenant_scope(::TimeTracking::Project).new(project_params)
        @project.tenant = current_tenant
        @project.user = current_user

        if @project.save
          render json: ::TimeTracking::ProjectSerializer.new(@project).as_json, status: :created
        else
          render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @project.update(project_params)
          render json: ::TimeTracking::ProjectSerializer.new(@project).as_json
        else
          render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @project.soft_delete!
          render json: { message: 'Project deleted successfully' }
        else
          render json: { error: @project.errors.full_messages.first || 'Error deleting project' }, status: :unprocessable_entity
        end
      end

      def restore
        if @project.restore!
          render json: {
            message: 'Project restored successfully',
            project: ::TimeTracking::ProjectSerializer.new(@project).as_json
          }
        else
          render json: { error: 'Error restoring project' }, status: :unprocessable_entity
        end
      end

      private

      def set_project
        @project = tenant_scope(::TimeTracking::Project).active.find(params[:id])
      end

      def set_project_with_deleted
        @project = tenant_scope(::TimeTracking::Project).unscope(where: :deleted_at).find(params[:id])
      end

      def project_params
        params.require(:project).permit(:label, :description, :status)
      end

      def require_admin
        unless current_user&.admin? || current_user&.super_admin? || current_user&.operator?
          render json: { error: 'Forbidden' }, status: :forbidden
        end
      end
    end
  end
end
