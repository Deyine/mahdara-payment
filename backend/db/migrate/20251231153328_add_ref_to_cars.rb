class AddRefToCars < ActiveRecord::Migration[8.0]
  def change
    add_column :cars, :ref, :integer
    add_index :cars, [:tenant_id, :ref], unique: true
  end
end
