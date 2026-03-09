class AddBankToEmployees < ActiveRecord::Migration[8.0]
  def change
    add_reference :employees, :bank, foreign_key: true, type: :uuid, null: true
    add_column :employees, :account_number, :string
  end
end
