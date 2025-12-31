class CreatePayments < ActiveRecord::Migration[8.0]
  def change
    create_table :payments, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :car, null: false, foreign_key: true, type: :uuid
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.date :payment_date, null: false
      t.string :payment_method  # 'cash', 'bank_transfer', 'check', 'other'
      t.text :notes

      t.timestamps
    end

    # Add indexes
    add_index :payments, :payment_date
    add_index :payments, [:car_id, :payment_date]
  end
end
