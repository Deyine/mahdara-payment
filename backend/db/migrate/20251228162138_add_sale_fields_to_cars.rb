class AddSaleFieldsToCars < ActiveRecord::Migration[8.0]
  def change
    add_column :cars, :status, :string, default: 'active', null: false
    add_column :cars, :sale_price, :decimal, precision: 10, scale: 2
    add_column :cars, :sale_date, :date

    # Add index for filtering by status
    add_index :cars, :status
  end
end
