class DropPhotoFromEmployees < ActiveRecord::Migration[8.0]
  def up
    remove_column :employees, :photo, :text if column_exists?(:employees, :photo)
  end

  def down
    add_column :employees, :photo, :text unless column_exists?(:employees, :photo)
  end
end
