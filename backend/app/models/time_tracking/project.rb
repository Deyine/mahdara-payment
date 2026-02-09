module TimeTracking
  class Project < ApplicationRecord
    self.table_name = 'time_tracking_projects'

    # Associations
    belongs_to :tenant
    belongs_to :user  # Creator
    has_many :tasks, class_name: 'TimeTracking::Task', foreign_key: :project_id, dependent: :restrict_with_error
    has_many :time_entries, through: :tasks

    # Validations
    validates :label, presence: true
    validates :label, uniqueness: {
      scope: [:tenant_id],
      conditions: -> { where(deleted_at: nil) },
      message: "has already been taken for this tenant"
    }
    validates :status, presence: true, inclusion: { in: %w[draft active completed archived] }

    # Scopes
    scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
    scope :active, -> { where(deleted_at: nil) }
    scope :deleted, -> { where.not(deleted_at: nil) }
    scope :by_status, ->(status) { where(status: status) }
    scope :recent, -> { order(created_at: :desc) }

    # Default ordering
    default_scope -> { order(:label) }

    # Calculate total time spent on this project (in seconds)
    def total_time_seconds
      time_entries.where(deleted_at: nil).sum(:duration_seconds).to_i
    end

    # Format total time as hours:minutes
    def total_time_formatted
      seconds = total_time_seconds
      hours = seconds / 3600
      minutes = (seconds % 3600) / 60
      "#{hours}h #{minutes}m"
    end

    # Count of tasks
    def tasks_count
      tasks.active.count
    end

    # Count of completed tasks
    def completed_tasks_count
      tasks.active.where(status: 'completed').count
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
  end
end
