module Api
  module TimeTracking
    class TimeEntriesController < ApplicationController
      include MultiTenantable

      before_action -> { require_permission(:time_tracking) }
      before_action :set_time_entry, only: [:show, :update, :destroy, :stop]

      def index
        entries_scope = tenant_scope(::TimeTracking::TimeEntry)

        # Filter by task
        if params[:task_id].present?
          entries_scope = entries_scope.for_task(params[:task_id])
        end

        # Filter by user (managers can see all, others only their own)
        if params[:user_id].present? && (current_user.admin? || current_user.super_admin?)
          entries_scope = entries_scope.for_user(params[:user_id])
        elsif !current_user.admin? && !current_user.super_admin?
          entries_scope = entries_scope.for_user(current_user.id)
        end

        # Filter running entries
        if params[:running] == 'true'
          entries_scope = entries_scope.running
        elsif params[:running] == 'false'
          entries_scope = entries_scope.completed
        end

        # Apply deleted filter
        entries_scope = entries_scope.active unless params[:include_deleted] == 'true'

        @entries = entries_scope.includes(:task, :user).all
        render json: @entries.map { |e| ::TimeTracking::TimeEntrySerializer.new(e).as_json }
      end

      def show
        render json: ::TimeTracking::TimeEntrySerializer.new(@entry).as_json
      end

      def create
        @entry = tenant_scope(::TimeTracking::TimeEntry).new(time_entry_params)
        @entry.tenant = current_tenant
        @entry.user = current_user

        if @entry.save
          render json: ::TimeTracking::TimeEntrySerializer.new(@entry).as_json, status: :created
        else
          render json: { errors: @entry.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        # Only owner or admin can update
        unless @entry.user_id == current_user.id || current_user.admin? || current_user.super_admin?
          render json: { error: 'Forbidden' }, status: :forbidden
          return
        end

        if @entry.update(time_entry_params)
          render json: ::TimeTracking::TimeEntrySerializer.new(@entry).as_json
        else
          render json: { errors: @entry.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        # Only owner or admin can delete
        unless @entry.user_id == current_user.id || current_user.admin? || current_user.super_admin?
          render json: { error: 'Forbidden' }, status: :forbidden
          return
        end

        if @entry.soft_delete!
          render json: { message: 'Time entry deleted successfully' }
        else
          render json: { error: 'Error deleting time entry' }, status: :unprocessable_entity
        end
      end

      def stop
        # Only owner can stop their timer
        unless @entry.user_id == current_user.id
          render json: { error: 'Forbidden' }, status: :forbidden
          return
        end

        end_time = params[:end_time].present? ? Time.zone.parse(params[:end_time]) : Time.current

        if @entry.stop!(end_time)
          render json: {
            message: 'Timer stopped',
            entry: ::TimeTracking::TimeEntrySerializer.new(@entry.reload).as_json
          }
        else
          render json: { errors: @entry.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_time_entry
        @entry = tenant_scope(::TimeTracking::TimeEntry).active.find(params[:id])
      end

      def time_entry_params
        params.require(:time_entry).permit(:title, :task_id, :start_time, :end_time, :duration_seconds, :notes)
      end
    end
  end
end
