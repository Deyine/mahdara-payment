class AddApplyImfToEmployeeTypes < ActiveRecord::Migration[8.0]
  def change
    add_column :employee_types, :apply_imf, :boolean, default: false, null: false
  end
end
