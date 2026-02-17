module TimeTracking
  class TaskSerializer
    def initialize(task)
      @task = task
    end

    def as_json
      {
        id: @task.id,
        title: @task.title,
        description: @task.description,
        position: @task.position,
        status: @task.status,
        estimated_minutes: @task.estimated_minutes,
        estimated_time_formatted: @task.estimated_time_formatted,
        project_id: @task.project_id,
        tenant_id: @task.tenant_id,
        user_id: @task.user_id,
        created_at: @task.created_at,
        updated_at: @task.updated_at,
        deleted_at: @task.deleted_at,
        deleted: @task.deleted?,

        # Calculated fields
        total_time_minutes: @task.total_time_minutes,
        total_time_formatted: @task.total_time_formatted,
        remaining_minutes: @task.remaining_minutes,
        entries_count: @task.entries_count,

        # Project info
        project: project_data,

        # Creator info
        user: user_data
      }
    end

    private

    def project_data
      return nil unless @task.project

      {
        id: @task.project.id,
        label: @task.project.label
      }
    end

    def user_data
      return nil unless @task.user

      {
        id: @task.user.id,
        name: @task.user.name,
        username: @task.user.username
      }
    end
  end
end
