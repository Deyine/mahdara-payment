class ChangeActiveStorageAttachmentsRecordIdToString < ActiveRecord::Migration[8.0]
  def up
    # Change record_id from bigint to string to support UUID polymorphic associations
    change_column :active_storage_attachments, :record_id, :string
  end

  def down
    # Revert back to bigint if needed
    change_column :active_storage_attachments, :record_id, :bigint
  end
end
