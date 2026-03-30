class WilayaSerializer
  def self.one(w)
    { id: w.id, name: w.name, code: w.code }
  end

  def self.many(records)
    records.map { |w| one(w) }
  end
end
