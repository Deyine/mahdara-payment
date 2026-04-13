class DocumentTemplateSerializer
  def self.one(t)
    {
      id: t.id,
      name: t.name,
      position: t.position,
      employee_type_id: t.employee_type_id,
      employees_count: t.employee_documents.count,
      uploaded_count: t.employee_documents.joins(:file_attachment).count
    }
  end

  def self.many(records)
    records.map { |t| one(t) }
  end
end
