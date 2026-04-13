class CreateEmployeeDocuments < ActiveRecord::Migration[8.0]
  def change
    create_table :employee_documents, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.references :employee, null: false, foreign_key: true, type: :uuid
      t.references :document_template, null: false, foreign_key: true, type: :uuid

      t.timestamps
    end
  end
end
