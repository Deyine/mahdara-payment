class AddScopeToBatchExports < ActiveRecord::Migration[8.0]
  def change
    add_reference :batch_exports, :wilaya, type: :uuid, foreign_key: true
    add_column :batch_exports, :niveau, :string
  end
end
