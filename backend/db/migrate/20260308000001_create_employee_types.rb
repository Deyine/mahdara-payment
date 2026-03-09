class CreateEmployeeTypes < ActiveRecord::Migration[8.0]
  def change
    create_table :employee_types, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :name, null: false
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :employee_types, :name, unique: true
  end
end
