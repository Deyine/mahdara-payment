class CreateTenants < ActiveRecord::Migration[8.0]
  def change
    enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')

    create_table :tenants, id: :uuid do |t|
      t.string :name, null: false
      t.string :subdomain
      t.boolean :active, default: true, null: false

      t.timestamps
    end

    add_index :tenants, :subdomain, unique: true
    add_index :tenants, :active
  end
end
