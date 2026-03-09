class AddFrenchNamesToEmployees < ActiveRecord::Migration[8.0]
  def change
    add_column :employees, :first_name_fr, :string
    add_column :employees, :last_name_fr, :string
    # Preserve existing data: copy current names (French) into the new _fr columns
    reversible do |dir|
      dir.up { execute "UPDATE employees SET first_name_fr = first_name, last_name_fr = last_name" }
    end
  end
end
