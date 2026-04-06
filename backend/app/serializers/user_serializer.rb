class UserSerializer
  def self.one(u)
    {
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      role_id: u.role_id,
      role_name: u.assigned_role&.name,
      role_permissions: u.assigned_role&.permissions || [],
      active: u.active,
      created_at: u.created_at,
      updated_at: u.updated_at
    }
  end

  def self.many(records)
    records.map { |u| one(u) }
  end
end
