class CreateBatchExports < ActiveRecord::Migration[8.0]
  def change
    create_table :batch_exports, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :recruitment_batch, null: false
      t.string :status, null: false, default: "pending"
      t.text :error
      t.uuid :requested_by_id

      t.timestamps
    end

    add_index :batch_exports, :requested_by_id
  end
end
