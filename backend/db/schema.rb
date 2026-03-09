# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record.

ActiveRecord::Schema[8.0].define(version: 2026_03_08_000005) do
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "username", null: false
    t.string "password_digest", null: false
    t.string "role", default: "user", null: false
    t.boolean "active", default: true, null: false
    t.jsonb "permissions", default: {}
    t.timestamps
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "employee_types", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.boolean "active", default: true, null: false
    t.timestamps
    t.index ["name"], name: "index_employee_types_on_name", unique: true
  end

  create_table "wilayas", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "code"
    t.timestamps
    t.index ["name"], name: "index_wilayas_on_name", unique: true
  end

  create_table "moughataa", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.references "wilaya", null: false, foreign_key: true, type: :uuid
    t.timestamps
  end

  create_table "communes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.references "moughataa", null: false, foreign_key: { to_table: "moughataa" }, type: :uuid
    t.timestamps
  end

  create_table "villages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.references "commune", null: false, foreign_key: true, type: :uuid
    t.timestamps
  end

  create_table "employees", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "nni", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.date "birth_date"
    t.string "phone"
    t.boolean "active", default: true, null: false
    t.references "employee_type", null: false, foreign_key: true, type: :uuid
    t.references "wilaya", foreign_key: true, type: :uuid
    t.references "moughataa", foreign_key: { to_table: "moughataa" }, type: :uuid
    t.references "commune", foreign_key: true, type: :uuid
    t.references "village", foreign_key: true, type: :uuid
    t.timestamps
    t.index ["nni"], name: "index_employees_on_nni", unique: true
  end

  create_table "contracts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.references "employee", null: false, foreign_key: true, type: :uuid
    t.string "contract_type", null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.date "start_date", null: false
    t.integer "duration_months"
    t.boolean "active", default: true, null: false
    t.timestamps
  end

  create_table "payment_batches", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.date "payment_date", null: false
    t.string "status", default: "draft", null: false
    t.text "notes"
    t.references "created_by", foreign_key: { to_table: :users }, type: :uuid
    t.timestamps
  end

  create_table "payment_batch_employees", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.references "payment_batch", null: false, foreign_key: true, type: :uuid
    t.references "employee", null: false, foreign_key: true, type: :uuid
    t.integer "months_count", null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.timestamps
    t.index ["payment_batch_id", "employee_id"], name: "index_pbe_on_batch_and_employee", unique: true
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
end
