class AddCatalogFieldsToCars < ActiveRecord::Migration[8.0]
  def change
    add_column :cars, :published, :boolean, default: false, null: false
    add_column :cars, :listing_price, :decimal, precision: 10, scale: 2

    add_index :cars, :published
  end
end
