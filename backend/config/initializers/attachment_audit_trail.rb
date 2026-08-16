Rails.application.config.to_prepare do
  ActiveStorage::Attachment.class_eval do
    # Plain (non-`_commit`) callbacks, to match paper_trail's own timing: they run
    # synchronously within the enclosing transaction, so when a cascade (e.g.
    # Employee#destroy) silences PaperTrail for a scoped block, that silence is
    # still in effect when this fires. `_commit` variants defer until the
    # outermost transaction commits, by which point any such block has already
    # exited and tracking would be back on.
    after_create { AttachmentAuditLogger.record(self, event: :attach) }
    after_destroy { AttachmentAuditLogger.record(self, event: :detach) }

    # `#detach`/`#purge` call `#delete` directly, bypassing `#destroy` and its
    # callbacks entirely (see ActiveStorage::Attached::Changes::DetachOne), so
    # `after_destroy_commit` never fires for those paths. Catch it here instead.
    def delete
      AttachmentAuditLogger.record(self, event: :detach)
      super
    end
  end
end
