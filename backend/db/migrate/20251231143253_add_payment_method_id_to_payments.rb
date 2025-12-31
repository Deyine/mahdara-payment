class AddPaymentMethodIdToPayments < ActiveRecord::Migration[8.0]
  def change
    # Remove old string column
    remove_column :payments, :payment_method, :string if column_exists?(:payments, :payment_method)

    # Add reference to payment_methods table (index is created automatically)
    add_reference :payments, :payment_method, foreign_key: true, type: :integer
  end
end
