class CreateCarShares < ActiveRecord::Migration[8.0]
  def change
    create_table :car_shares, id: :uuid do |t|
      t.references :tenant, null: false, foreign_key: true, type: :uuid
      t.references :car, null: false, foreign_key: true, type: :uuid
      t.references :created_by, null: false, foreign_key: { to_table: :users }, type: :bigint

      t.string :token, null: false
      t.boolean :show_costs, default: false, null: false
      t.boolean :show_expenses, default: false, null: false
      t.datetime :expires_at
      t.integer :view_count, default: 0, null: false

      t.timestamps
    end

    add_index :car_shares, :token, unique: true
    add_index :car_shares, [:car_id, :tenant_id]
    add_index :car_shares, :expires_at
  end
end
