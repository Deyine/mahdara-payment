class CreateTimeTrackingTables < ActiveRecord::Migration[8.0]
  def change
    # TimeTracking::Projects
    create_table :time_tracking_projects, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :bigint
      t.string :label, null: false
      t.text :description
      t.string :status, null: false, default: 'active'
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :time_tracking_projects, [:tenant_id, :label], unique: true, where: 'deleted_at IS NULL', name: 'index_time_tracking_projects_on_tenant_and_label'
    add_index :time_tracking_projects, :status
    add_index :time_tracking_projects, :deleted_at

    # TimeTracking::Tasks
    create_table :time_tracking_tasks, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :project, null: false, foreign_key: { to_table: :time_tracking_projects }, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :bigint
      t.string :title, null: false
      t.text :description
      t.integer :position, null: false, default: 0
      t.string :status, null: false, default: 'active'
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :time_tracking_tasks, [:project_id, :position]
    add_index :time_tracking_tasks, :status
    add_index :time_tracking_tasks, :deleted_at

    # TimeTracking::TimeEntries
    create_table :time_tracking_time_entries, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :task, null: false, foreign_key: { to_table: :time_tracking_tasks }, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :bigint
      t.string :title, null: false
      t.datetime :start_time, null: false
      t.datetime :end_time
      t.integer :duration_seconds
      t.text :notes
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :time_tracking_time_entries, [:task_id, :start_time]
    add_index :time_tracking_time_entries, [:user_id, :start_time]
    add_index :time_tracking_time_entries, :deleted_at
  end
end
