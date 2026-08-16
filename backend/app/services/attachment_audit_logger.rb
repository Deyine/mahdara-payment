# Active Storage attachments (Employee#photo, EmployeeDocument#file, Mahdara#mahl_ilmi)
# live in a separate join table and are invisible to paper_trail's column-level dirty
# tracking. This records attach/detach as a manual version on the owner record so the
# audit trail actually reflects file changes instead of showing nothing.
class AttachmentAuditLogger
  TRACKED_TYPES = %w[Employee EmployeeDocument Mahdara].freeze

  def self.record(attachment, event:)
    return unless TRACKED_TYPES.include?(attachment.record_type)
    return unless PaperTrail.request.enabled?

    filename = attachment.blob&.filename&.to_s
    old_value, new_value = event == :attach ? [nil, filename] : [filename, nil]
    info = PaperTrail.request.controller_info || {}

    PaperTrail::Version.create!(
      item_type: attachment.record_type,
      item_id: attachment.record_id,
      event: 'update',
      whodunnit: PaperTrail.request.whodunnit,
      object_changes: { attachment.name => [old_value, new_value] },
      ip_address: info[:ip_address],
      user_agent: info[:user_agent],
      created_at: Time.current
    )
  end
end
