class AddPermissionsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :permissions, :jsonb, default: {}, null: false
  end
end
