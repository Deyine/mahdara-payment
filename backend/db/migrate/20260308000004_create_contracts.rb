class CreateContracts < ActiveRecord::Migration[8.0]
  def change
    create_table :contracts, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :employee, null: false, foreign_key: true, type: :uuid
      t.string :contract_type, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.date :start_date, null: false
      t.integer :duration_months
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :contracts, [:employee_id, :active]
  end
end
