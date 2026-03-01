class AddPhotoOrderToCars < ActiveRecord::Migration[8.0]
  def change
    add_column :cars, :salvage_photos_order, :jsonb, default: []
    add_column :cars, :after_repair_photos_order, :jsonb, default: []
  end
end
