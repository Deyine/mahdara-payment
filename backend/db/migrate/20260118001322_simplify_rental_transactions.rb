class SimplifyRentalTransactions < ActiveRecord::Migration[8.0]
  def change
    # Remove start_date, end_date, and status columns (we only track completed rentals now)
    remove_column :rental_transactions, :start_date, :date
    remove_column :rental_transactions, :end_date, :date
    remove_column :rental_transactions, :status, :string

    # Add locataire (renter name) and rental_date (when the rental occurred)
    add_column :rental_transactions, :locataire, :string, null: false
    add_column :rental_transactions, :rental_date, :date, null: false

    # Add index on rental_date for sorting
    add_index :rental_transactions, :rental_date
  end
end
