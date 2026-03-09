class CreateBanks < ActiveRecord::Migration[8.0]
  def change
    create_table :banks, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :name, null: false
      t.boolean :active, default: true, null: false
      t.timestamps
    end
    add_index :banks, :name, unique: true
  end
end
