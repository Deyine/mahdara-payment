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

    # Calculate total time spent on this task (in seconds)
    def total_time_seconds
      time_entries.where(deleted_at: nil).sum(:duration_seconds).to_i
    end

    # Format total time
    def total_time_formatted
      seconds = total_time_seconds
      hours = seconds / 3600
      minutes = (seconds % 3600) / 60
      "#{hours}h #{minutes}m"
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
