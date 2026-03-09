class CreateEmployees < ActiveRecord::Migration[8.0]
  def change
    create_table :employees, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :employee_type, null: false, foreign_key: true, type: :uuid
      t.string :nni, null: false
      t.string :first_name, null: false
      t.string :last_name, null: false
      t.date :birth_date
      t.string :phone
      t.references :wilaya, foreign_key: true, type: :uuid
      t.references :moughataa, foreign_key: { to_table: :moughataa }, type: :uuid
      t.references :commune, foreign_key: true, type: :uuid
      t.references :village, foreign_key: true, type: :uuid
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :employees, :nni, unique: true
    add_index :employees, :active
  end
end
