class AddProfitShareToRentalTransactions < ActiveRecord::Migration[8.0]
  def change
    add_column :rental_transactions, :profit_share_user_id, :bigint
    add_column :rental_transactions, :profit_per_day, :decimal, precision: 10, scale: 2, default: 0

    add_foreign_key :rental_transactions, :users, column: :profit_share_user_id
    add_index :rental_transactions, :profit_share_user_id
  end
end
