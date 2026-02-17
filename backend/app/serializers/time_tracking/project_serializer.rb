module TimeTracking
  class ProjectSerializer
    def initialize(project)
      @project = project
    end

    def as_json
      {
        id: @project.id,
        label: @project.label,
        description: @project.description,
        status: @project.status,
        tenant_id: @project.tenant_id,
        user_id: @project.user_id,
        created_at: @project.created_at,
        updated_at: @project.updated_at,
        deleted_at: @project.deleted_at,
        deleted: @project.deleted?,

        # Calculated fields
        total_time_minutes: @project.total_time_minutes,
        total_time_formatted: @project.total_time_formatted,
        total_estimated_minutes: @project.total_estimated_minutes,
        total_estimated_formatted: @project.total_estimated_formatted,
        tasks_count: @project.tasks_count,
        completed_tasks_count: @project.completed_tasks_count,

        # Creator info
        user: user_data
      }
    end

    private

    def user_data
      return nil unless @project.user

      {
        id: @project.user.id,
        name: @project.user.name,
        username: @project.user.username
      }
    end
  end
end
