class EmployeeTypeSerializer
  def self.one(t, full: false)
    data = { id: t.id, name: t.name, active: t.active, is_mahdara: t.is_mahdara, apply_imf: t.apply_imf, created_at: t.created_at }
    data[:document_templates] = DocumentTemplateSerializer.many(t.document_templates) if full
    data
  end

  def self.many(records)
    records.map { |t| one(t) }
  end
end
