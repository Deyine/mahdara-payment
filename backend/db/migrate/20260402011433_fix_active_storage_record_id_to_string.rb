class FixActiveStorageRecordIdToString < ActiveRecord::Migration[8.0]
  def up
    # Remove stale attachments written with record_id = 0 (UUID cast to bigint)
    ActiveStorage::Attachment.where(record_id: 0).delete_all

    change_column :active_storage_attachments, :record_id, :string, null: false
  end

  def down
    change_column :active_storage_attachments, :record_id, :bigint, null: false
  end
end
