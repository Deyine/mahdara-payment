module TimeTracking
  class TimeEntry < ApplicationRecord
    self.table_name = 'time_tracking_time_entries'

    # Associations
    belongs_to :tenant
    belongs_to :task, class_name: 'TimeTracking::Task'
    belongs_to :user  # Who logged the time

    # Validations
    validates :title, presence: true
    validates :start_time, presence: true
    validate :end_time_after_start_time

    # Scopes
    scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
    scope :for_task, ->(task_id) { where(task_id: task_id) }
    scope :for_user, ->(user_id) { where(user_id: user_id) }
    scope :active, -> { where(deleted_at: nil) }
    scope :deleted, -> { where.not(deleted_at: nil) }
    scope :running, -> { where(end_time: nil) }
    scope :completed, -> { where.not(end_time: nil) }
    scope :recent, -> { order(start_time: :desc) }

    # Default ordering
    default_scope -> { order(start_time: :desc) }

    # Callbacks
    before_save :calculate_duration

    # Get duration in seconds
    def duration
      duration_seconds.to_i
    end

    # Format duration
    def duration_formatted
      return "Running..." unless end_time

      seconds = duration_seconds.to_i
      hours = seconds / 3600
      minutes = (seconds % 3600) / 60
      "#{hours}h #{minutes}m"
    end

    # Check if timer is running
    def running?
      end_time.nil?
    end

    # Stop the timer
    def stop!(stop_time = Time.current)
      update!(end_time: stop_time)
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

    def calculate_duration
      if end_time && start_time
        self.duration_seconds = (end_time - start_time).to_i
      end
    end

    def end_time_after_start_time
      return unless end_time && start_time

      if end_time <= start_time
        errors.add(:end_time, 'must be after start time')
      end
    end
  end
end
