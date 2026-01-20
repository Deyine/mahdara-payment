class CreateDebts < ActiveRecord::Migration[8.0]
  def change
    create_table :debts, id: :uuid do |t|
      t.uuid :tenant_id, null: false
      t.string :debtor_name, null: false
      t.bigint :user_id
      t.string :direction, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.date :debt_date, null: false
      t.text :notes

      t.timestamps
    end

    add_foreign_key :debts, :tenants
    add_foreign_key :debts, :users
    add_index :debts, :tenant_id
    add_index :debts, :user_id
    add_index :debts, :debt_date
    add_index :debts, :direction
  end
end
