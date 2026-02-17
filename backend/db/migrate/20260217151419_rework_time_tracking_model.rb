class ReworkTimeTrackingModel < ActiveRecord::Migration[8.0]
  def change
    # Add estimated time to tasks
    add_column :time_tracking_tasks, :estimated_minutes, :integer

    # Rework time entries: remove timer columns, add manual entry columns
    remove_column :time_tracking_time_entries, :start_time, :datetime
    remove_column :time_tracking_time_entries, :end_time, :datetime
    remove_column :time_tracking_time_entries, :duration_seconds, :integer
    add_column :time_tracking_time_entries, :duration_minutes, :integer, null: false, default: 0
    add_column :time_tracking_time_entries, :entry_date, :date, null: false, default: -> { 'CURRENT_DATE' }
  end
end
