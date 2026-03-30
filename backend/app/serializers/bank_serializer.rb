class BankSerializer
  def self.one(b)
    { id: b.id, name: b.name, active: b.active, created_at: b.created_at }
  end

  def self.many(records)
    records.map { |b| one(b) }
  end
end
