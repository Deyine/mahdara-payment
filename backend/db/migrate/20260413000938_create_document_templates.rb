class CreateDocumentTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :document_templates, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :employee_type, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.integer :position, default: 0

      t.timestamps
    end
  end
end
