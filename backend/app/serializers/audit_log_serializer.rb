class AuditLogSerializer
  def self.many(versions, **opts)
    versions.map { |v| one(v, **opts) }
  end

  def self.one(v, users_by_id: {})
    user = users_by_id[v.whodunnit]
    {
      id: v.id,
      item_type: v.item_type,
      item_id: v.item_id,
      event: v.event,
      whodunnit: v.whodunnit ? { id: v.whodunnit, name: user&.name } : nil,
      created_at: v.created_at,
      ip_address: v.ip_address,
      user_agent: v.user_agent,
      changes: (v.changeset || {}).except('created_at', 'updated_at')
    }
  end
end
