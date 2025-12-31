class CreatePaymentMethods < ActiveRecord::Migration[8.0]
  def change
    create_table :payment_methods do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.boolean :active, default: true, null: false
      t.timestamps
    end

    # Add indexes
    add_index :payment_methods, [:tenant_id, :name], unique: true
    add_index :payment_methods, :active
  end
end
