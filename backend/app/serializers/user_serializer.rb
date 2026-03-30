class UserSerializer
  def self.one(u)
    {
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      active: u.active,
      permissions: u.permissions || {},
      created_at: u.created_at,
      updated_at: u.updated_at
    }
  end

  def self.many(records)
    records.map { |u| one(u) }
  end
end
