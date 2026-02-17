module Api
  module TimeTracking
    class TasksController < ApplicationController
      include MultiTenantable

      before_action -> { require_permission(:time_tracking) }
      before_action :set_task, only: [:show, :update, :destroy, :complete]
      before_action :require_admin, except: [:index, :show]

      def index
        tasks_scope = tenant_scope(::TimeTracking::Task)

        # Filter by project
        if params[:project_id].present?
          tasks_scope = tasks_scope.for_project(params[:project_id])
        end

        # Filter by status
        if params[:status].present?
          tasks_scope = tasks_scope.by_status(params[:status])
        end

        # Apply deleted filter
        if params[:include_deleted] == 'true'
          tasks_scope = tasks_scope.unscope(where: :deleted_at)
        elsif params[:only_deleted] == 'true'
          tasks_scope = tasks_scope.unscope(where: :deleted_at).deleted
        else
          tasks_scope = tasks_scope.active
        end

        @tasks = tasks_scope.includes(:project, :user, :time_entries).all
        render json: @tasks.map { |t| ::TimeTracking::TaskSerializer.new(t).as_json }
      end

      def show
        render json: ::TimeTracking::TaskSerializer.new(@task).as_json
      end

      def create
        @task = tenant_scope(::TimeTracking::Task).new(task_params)
        @task.tenant = current_tenant
        @task.user = current_user

        if @task.save
          render json: ::TimeTracking::TaskSerializer.new(@task).as_json, status: :created
        else
          render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @task.update(task_params)
          render json: ::TimeTracking::TaskSerializer.new(@task).as_json
        else
          render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        if @task.soft_delete!
          render json: { message: 'Task deleted successfully' }
        else
          render json: { error: 'Error deleting task' }, status: :unprocessable_entity
        end
      end

      def complete
        if @task.mark_completed!
          render json: {
            message: 'Task marked as completed',
            task: ::TimeTracking::TaskSerializer.new(@task.reload).as_json
          }
        else
          render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_task
        @task = tenant_scope(::TimeTracking::Task).active.find(params[:id])
      end

      def task_params
        params.require(:task).permit(:title, :description, :project_id, :position, :status)
      end

      def require_admin
        unless current_user&.admin? || current_user&.super_admin?
          render json: { error: 'Forbidden' }, status: :forbidden
        end
      end
    end
  end
end
