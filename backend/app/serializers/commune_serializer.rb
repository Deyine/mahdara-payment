class CommuneSerializer
  def self.one(c)
    {
      id: c.id,
      name: c.name,
      moughataa_id: c.moughataa_id,
      moughataa: c.moughataa ? { id: c.moughataa.id, name: c.moughataa.name } : nil
    }
  end

  def self.many(records)
    records.map { |c| one(c) }
  end
end
