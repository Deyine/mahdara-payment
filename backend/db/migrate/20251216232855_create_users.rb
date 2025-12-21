class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :username, null: false
      t.string :password_digest, null: false
      t.string :role, null: false
      t.references :tenant, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end

    add_index :users, :username, unique: true
    add_index :users, [:tenant_id, :role]
  end
end
