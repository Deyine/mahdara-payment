class CreateTags < ActiveRecord::Migration[8.0]
  def change
    create_table :tags, id: :uuid do |t|
      t.string :name, null: false
      t.string :color, default: '#167bff'
      t.references :tenant, type: :uuid, null: false, foreign_key: true
      t.timestamps
    end

    add_index :tags, [:tenant_id, :name], unique: true
  end
end
