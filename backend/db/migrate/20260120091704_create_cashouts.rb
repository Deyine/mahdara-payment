class CreateCashouts < ActiveRecord::Migration[8.0]
  def change
    create_table :cashouts, id: :uuid do |t|
      t.uuid :tenant_id, null: false
      t.bigint :user_id, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.date :cashout_date, null: false
      t.text :notes

      t.timestamps
    end

    add_foreign_key :cashouts, :tenants
    add_foreign_key :cashouts, :users
    add_index :cashouts, :tenant_id
    add_index :cashouts, :user_id
    add_index :cashouts, :cashout_date
  end
end
