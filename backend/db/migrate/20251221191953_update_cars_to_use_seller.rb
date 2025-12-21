class UpdateCarsToUseSeller < ActiveRecord::Migration[8.0]
  def change
    # Add seller_id reference
    add_reference :cars, :seller, type: :uuid, foreign_key: true

    # Remove old seller and location columns
    remove_column :cars, :seller, :string
    remove_column :cars, :location, :string
  end
end
