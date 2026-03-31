class EmployeeTypeSerializer
  def self.one(t)
    { id: t.id, name: t.name, active: t.active, is_mahdara: t.is_mahdara, apply_imf: t.apply_imf, created_at: t.created_at }
  end

  def self.many(records)
    records.map { |t| one(t) }
  end
end
