class AddReferenceToContracts < ActiveRecord::Migration[8.0]
  def change
    add_column :contracts, :reference, :string
    add_index :contracts, :reference, unique: true
  end
end
