class CreateSalaryAmounts < ActiveRecord::Migration[8.0]
  def change
    create_table :salary_amounts, id: :uuid do |t|
      t.integer :amount, null: false
      t.timestamps
    end
    add_index :salary_amounts, :amount, unique: true
  end
end
