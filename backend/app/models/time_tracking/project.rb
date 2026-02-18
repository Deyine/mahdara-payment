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

    # Calculate total time spent on this project (in minutes)
    def total_time_minutes
      time_entries.where(deleted_at: nil).sum(:duration_minutes).to_i
    end

    # Format total consumed time
    def total_time_formatted
      hours = total_time_minutes / 60
      mins = total_time_minutes % 60
      "#{hours}h #{mins}m"
    end

    # Total estimated minutes across all tasks
    def total_estimated_minutes
      tasks.active.sum(:estimated_minutes).to_i
    end

    # Format total estimated time
    def total_estimated_formatted
      hours = total_estimated_minutes / 60
      mins = total_estimated_minutes % 60
      "#{hours}h #{mins}m"
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
      if tasks.active.joins(:time_entries).where(time_tracking_time_entries: { deleted_at: nil }).exists?
        errors.add(:base, 'Cannot delete a project that contains tasks with time entries')
        return false
      end
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
