class CreateSellers < ActiveRecord::Migration[8.0]
  def change
    create_table :sellers, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.string :location
      t.boolean :active, default: true, null: false

      t.timestamps
    end

    add_index :sellers, [:tenant_id, :name], unique: true
    add_index :sellers, :active
  end
end
