class AddBirthPlaceToEmployees < ActiveRecord::Migration[8.0]
  def change
    add_column :employees, :birth_place, :string
  end
end
