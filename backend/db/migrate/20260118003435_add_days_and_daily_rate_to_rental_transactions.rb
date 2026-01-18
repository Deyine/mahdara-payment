class AddDaysAndDailyRateToRentalTransactions < ActiveRecord::Migration[8.0]
  def change
    # Remove old billing/renter fields
    remove_column :rental_transactions, :billing_frequency, :string
    remove_column :rental_transactions, :rate_per_period, :decimal
    remove_column :rental_transactions, :renter_name, :string
    remove_column :rental_transactions, :renter_phone, :string
    remove_column :rental_transactions, :renter_id_number, :string

    # Add simplified rental fields
    add_column :rental_transactions, :days, :integer, null: false
    add_column :rental_transactions, :daily_rate, :decimal, precision: 10, scale: 2, null: false
  end
end
