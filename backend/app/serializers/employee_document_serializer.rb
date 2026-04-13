class EmployeeDocumentSerializer
  def self.one(d)
    {
      id: d.id,
      employee_id: d.employee_id,
      document_template: DocumentTemplateSerializer.one(d.document_template),
      file_url: d.file.attached? ? Rails.application.routes.url_helpers.rails_blob_path(d.file, only_path: true) : nil,
      file_name: d.file.attached? ? d.file.filename.to_s : nil,
      uploaded_at: d.file.attached? ? d.updated_at : nil
    }
  end

  def self.many(records)
    records.map { |d| one(d) }
  end
end
