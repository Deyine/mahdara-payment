class CreateCarModels < ActiveRecord::Migration[8.0]
  def change
    create_table :car_models, id: :uuid do |t|
      t.string :name, null: false
      t.boolean :active, default: true, null: false
      t.references :tenant, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end

    add_index :car_models, [:tenant_id, :name], unique: true
    add_index :car_models, :active
  end
end
