class CreateMahdaras < ActiveRecord::Migration[8.0]
  def change
    create_table :mahdaras, id: :uuid do |t|
      t.references :employee, null: false, foreign_key: true, type: :uuid, index: { unique: true }
      t.string :nom, null: false
      t.string :numero_releve
      t.string :mahdara_type
      t.references :wilaya, foreign_key: true, type: :uuid
      t.references :moughataa, foreign_key: { to_table: :moughataa }, type: :uuid
      t.references :commune, foreign_key: true, type: :uuid
      t.references :village, foreign_key: true, type: :uuid
      t.integer :nombre_etudiants
      t.timestamps
    end
  end
end
