class MoughataaSerializer
  def self.one(m)
    {
      id: m.id,
      name: m.name,
      wilaya_id: m.wilaya_id,
      wilaya: m.wilaya ? WilayaSerializer.one(m.wilaya) : nil
    }
  end

  def self.many(records)
    records.map { |m| one(m) }
  end
end
