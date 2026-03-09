class CreatePaymentBatches < ActiveRecord::Migration[8.0]
  def change
    create_table :payment_batches, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.bigint :created_by_id, null: false
      t.string :label
      t.date :payment_date, null: false
      t.decimal :total_amount, precision: 10, scale: 2, default: 0
      t.string :status, default: 'draft', null: false
      t.timestamps
    end
    add_index :payment_batches, :payment_date
    add_index :payment_batches, :status
    add_foreign_key :payment_batches, :users, column: :created_by_id

    create_table :payment_batch_employees, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :payment_batch, null: false, foreign_key: true, type: :uuid
      t.references :employee, null: false, foreign_key: true, type: :uuid
      t.references :contract, null: false, foreign_key: true, type: :uuid
      t.integer :months_count, default: 1, null: false
      t.decimal :amount_per_month, precision: 10, scale: 2, null: false
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.timestamps
    end
    add_index :payment_batch_employees, [:payment_batch_id, :employee_id], unique: true
  end
end
