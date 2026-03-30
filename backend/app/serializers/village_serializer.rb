class VillageSerializer
  def self.one(v)
    {
      id: v.id,
      name: v.name,
      commune_id: v.commune_id,
      commune: v.commune ? { id: v.commune.id, name: v.commune.name } : nil
    }
  end

  def self.many(records)
    records.map { |v| one(v) }
  end
end
