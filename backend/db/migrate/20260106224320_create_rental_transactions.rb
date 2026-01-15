class CreateRentalTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :rental_transactions, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :car, null: false, foreign_key: true, type: :uuid

      # Rental period
      t.date :start_date, null: false
      t.date :end_date                    # NULL = currently rented

      # Financial
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :billing_frequency         # 'daily', 'weekly', 'monthly'
      t.decimal :rate_per_period, precision: 10, scale: 2

      # Renter information
      t.string :renter_name, null: false
      t.string :renter_phone
      t.string :renter_id_number
      t.text :notes

      # Status tracking
      t.string :status, default: 'active', null: false  # 'active', 'completed', 'cancelled'

      t.timestamps
    end

    # Indexes for efficient queries
    add_index :rental_transactions, :start_date
    add_index :rental_transactions, :end_date
    add_index :rental_transactions, [:car_id, :start_date]
    add_index :rental_transactions, [:car_id, :status]
    add_index :rental_transactions, :status
  end
end
