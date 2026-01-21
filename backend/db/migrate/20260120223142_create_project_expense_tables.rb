class CreateProjectExpenseTables < ActiveRecord::Migration[8.0]
  def change
    # Projects table
    create_table :projects, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.text :description
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :projects, [:tenant_id, :name], unique: true

    # Project Expense Categories table
    create_table :project_expense_categories do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.text :description
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :project_expense_categories, [:tenant_id, :name], unique: true
    add_index :project_expense_categories, :active

    # Project Expenses table
    create_table :project_expenses, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :project, null: false, foreign_key: true, type: :uuid
      t.references :project_expense_category, null: false, foreign_key: true, type: :integer
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.date :expense_date, null: false
      t.text :description
      t.timestamps
    end
    add_index :project_expenses, :expense_date
    add_index :project_expenses, [:project_id, :expense_date]
  end
end
