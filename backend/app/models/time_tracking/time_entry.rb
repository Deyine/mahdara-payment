module TimeTracking
  class TimeEntry < ApplicationRecord
    self.table_name = 'time_tracking_time_entries'

    # Associations
    belongs_to :tenant
    belongs_to :task, class_name: 'TimeTracking::Task'
    belongs_to :user  # Who logged the time

    # Validations
    validates :title, presence: true
    validates :duration_minutes, presence: true, numericality: { only_integer: true, greater_than: 0 }
    validates :entry_date, presence: true

    # Scopes
    scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
    scope :for_task, ->(task_id) { where(task_id: task_id) }
    scope :for_user, ->(user_id) { where(user_id: user_id) }
    scope :active, -> { where(deleted_at: nil) }
    scope :deleted, -> { where.not(deleted_at: nil) }
    scope :recent, -> { order(entry_date: :desc) }

    # Default ordering
    default_scope -> { order(entry_date: :desc, created_at: :desc) }

    # Format duration
    def duration_formatted
      hours = duration_minutes / 60
      mins = duration_minutes % 60
      "#{hours}h #{mins}m"
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
