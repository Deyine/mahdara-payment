module TimeTracking
  class TimeEntrySerializer
    def initialize(time_entry)
      @entry = time_entry
    end

    def as_json
      {
        id: @entry.id,
        title: @entry.title,
        start_time: @entry.start_time,
        end_time: @entry.end_time,
        duration_seconds: @entry.duration_seconds,
        duration_formatted: @entry.duration_formatted,
        notes: @entry.notes,
        running: @entry.running?,
        task_id: @entry.task_id,
        tenant_id: @entry.tenant_id,
        user_id: @entry.user_id,
        created_at: @entry.created_at,
        updated_at: @entry.updated_at,
        deleted_at: @entry.deleted_at,
        deleted: @entry.deleted?,

        # Task info
        task: task_data,

        # User info
        user: user_data
      }
    end

    private

    def task_data
      return nil unless @entry.task

      {
        id: @entry.task.id,
        title: @entry.task.title,
        project: {
          id: @entry.task.project.id,
          label: @entry.task.project.label
        }
      }
    end

    def user_data
      return nil unless @entry.user

      {
        id: @entry.user.id,
        name: @entry.user.name,
        username: @entry.user.username
      }
    end
  end
end
