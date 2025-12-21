class CreateExpenseCategories < ActiveRecord::Migration[8.0]
  def change
    create_table :expense_categories, id: :uuid do |t|
      t.string :name, null: false
      t.string :expense_type, null: false # 'reparation' or 'purchase'
      t.boolean :active, default: true, null: false
      t.references :tenant, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end

    add_index :expense_categories, [:tenant_id, :name], unique: true
    add_index :expense_categories, :expense_type
    add_index :expense_categories, :active
  end
end
