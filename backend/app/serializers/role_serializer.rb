class RoleSerializer
  def self.one(r)
    {
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions || [],
      users_count: r.try(:users_count).to_i,
      created_at: r.created_at,
      updated_at: r.updated_at
    }
  end

  def self.many(records)
    records.map { |r| one(r) }
  end
end
