class AddRoleIdToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :role_id, :uuid
    add_foreign_key :users, :roles, on_delete: :nullify
    add_index :users, :role_id
  end
end
