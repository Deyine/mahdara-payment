class AddSoftDeleteToPaymentBatches < ActiveRecord::Migration[8.0]
  def change
    add_column :payment_batches, :deleted_at, :datetime
    add_column :payment_batch_employees, :deleted_at, :datetime
    add_index :payment_batches, :deleted_at
  end
end
