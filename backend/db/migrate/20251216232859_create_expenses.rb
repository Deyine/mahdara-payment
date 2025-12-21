class CreateExpenses < ActiveRecord::Migration[8.0]
  def change
    create_table :expenses, id: :uuid do |t|
      t.references :car, type: :uuid, null: false, foreign_key: true
      t.references :expense_category, type: :uuid, null: false, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.text :description
      t.date :expense_date, null: false
      t.references :tenant, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end

    add_index :expenses, [:tenant_id, :car_id]
    add_index :expenses, :expense_date
  end
end
