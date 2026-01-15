class CreateCarTags < ActiveRecord::Migration[8.0]
  def change
    create_table :car_tags, id: :uuid do |t|
      t.references :car, type: :uuid, null: false, foreign_key: true
      t.references :tag, type: :uuid, null: false, foreign_key: true
      t.timestamps
    end

    add_index :car_tags, [:car_id, :tag_id], unique: true
  end
end
