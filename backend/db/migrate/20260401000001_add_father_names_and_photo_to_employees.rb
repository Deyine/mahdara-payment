class AddFatherNamesAndPhotoToEmployees < ActiveRecord::Migration[8.0]
  def change
    add_column :employees, :pere_prenom_ar, :string
    add_column :employees, :pere_prenom_fr, :string
  end
end
