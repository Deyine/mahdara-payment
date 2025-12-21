class CreateCars < ActiveRecord::Migration[8.0]
  def change
    create_table :cars, id: :uuid do |t|
      t.string :vin, null: false
      t.references :car_model, type: :uuid, null: false, foreign_key: true
      t.integer :year, null: false
      t.string :color
      t.integer :mileage
      t.date :purchase_date, null: false
      t.decimal :purchase_price, precision: 10, scale: 2, null: false
      t.string :seller
      t.string :location
      t.decimal :clearance_cost, precision: 10, scale: 2
      t.decimal :towing_cost, precision: 10, scale: 2
      t.references :tenant, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end

    add_index :cars, [:tenant_id, :vin], unique: true
    add_index :cars, :purchase_date
  end
end
