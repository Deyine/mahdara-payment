class AddIsMahdaraToEmployeeTypes < ActiveRecord::Migration[8.0]
  def change
    add_column :employee_types, :is_mahdara, :boolean, default: false, null: false
  end
end
