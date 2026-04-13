class DocumentTemplateSerializer
  def self.one(t)
    {
      id: t.id,
      name: t.name,
      position: t.position,
      employee_type_id: t.employee_type_id,
      employees_count: t.employee_documents.size,
      uploaded_count: t.employee_documents.count(&:file_attached?)
    }
  end

  def self.many(records)
    records.map { |t| one(t) }
  end
end
