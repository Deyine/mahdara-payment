class CreateLocationHierarchy < ActiveRecord::Migration[8.0]
  def change
    create_table :wilayas, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string :name, null: false
      t.string :code
      t.timestamps
    end
    add_index :wilayas, :name, unique: true

    create_table :moughataa, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :wilaya, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.timestamps
    end
    add_index :moughataa, [:wilaya_id, :name], unique: true

    create_table :communes, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :moughataa, null: false, foreign_key: { to_table: :moughataa }, type: :uuid
      t.string :name, null: false
      t.timestamps
    end
    add_index :communes, [:moughataa_id, :name], unique: true

    create_table :villages, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :commune, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.timestamps
    end
    add_index :villages, [:commune_id, :name], unique: true
  end
end
