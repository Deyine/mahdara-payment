module TimeTracking
  class Task < ApplicationRecord
    self.table_name = 'time_tracking_tasks'

    # Associations
    belongs_to :tenant
    belongs_to :project, class_name: 'TimeTracking::Project'
    belongs_to :user  # Creator
    has_many :time_entries, class_name: 'TimeTracking::TimeEntry', foreign_key: :task_id, dependent: :restrict_with_error

    # Validations
    validates :title, presence: true
    validates :status, presence: true, inclusion: { in: %w[active completed archived] }
    validates :position, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
    validates :estimated_minutes, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true

    # Scopes
    scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
    scope :for_project, ->(project_id) { where(project_id: project_id) }
    scope :active, -> { where(deleted_at: nil) }
    scope :deleted, -> { where.not(deleted_at: nil) }
    scope :by_status, ->(status) { where(status: status) }
    scope :ordered, -> { order(:position) }

    # Default ordering
    default_scope -> { order(:position) }

    # Callbacks
    before_create :set_position

    # Calculate total time spent on this task (in minutes)
    def total_time_minutes
      time_entries.where(deleted_at: nil).sum(:duration_minutes).to_i
    end

    # Format total time
    def total_time_formatted
      hours = total_time_minutes / 60
      mins = total_time_minutes % 60
      "#{hours}h #{mins}m"
    end

    # Format estimated time
    def estimated_time_formatted
      return nil unless estimated_minutes

      hours = estimated_minutes / 60
      mins = estimated_minutes % 60
      "#{hours}h #{mins}m"
    end

    # Remaining minutes (estimated - consumed)
    def remaining_minutes
      return nil unless estimated_minutes

      estimated_minutes - total_time_minutes
    end

    # Count of time entries
    def entries_count
      time_entries.active.count
    end

    # Mark as completed
    def mark_completed!
      update!(status: 'completed')
    end

    # Soft deletion
    def soft_delete!
      update(deleted_at: Time.current)
    end

    def restore!
      update(deleted_at: nil)
    end

    def deleted?
      deleted_at.present?
    end

    private

    def set_position
      return if position.present? && position >= 0

      max_position = project.tasks.unscope(:order).active.maximum(:position).to_i
      self.position = max_position + 1
    end
  end
end
