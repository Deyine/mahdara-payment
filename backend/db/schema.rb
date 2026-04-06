# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_04_06_000002) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.string "record_id", null: false
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

  create_table "banks", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_banks_on_name", unique: true
  end

  create_table "communes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.uuid "moughataa_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["moughataa_id"], name: "index_communes_on_moughataa_id"
  end

  create_table "contracts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "employee_id", null: false
    t.string "contract_type", null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.date "start_date", null: false
    t.integer "duration_months"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["employee_id"], name: "index_contracts_on_employee_id"
  end

  create_table "employee_types", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_mahdara", default: false, null: false
    t.boolean "apply_imf", default: false, null: false
    t.index ["name"], name: "index_employee_types_on_name", unique: true
  end

  create_table "employees", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "nni", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.date "birth_date"
    t.string "phone"
    t.boolean "active", default: true, null: false
    t.uuid "employee_type_id", null: false
    t.uuid "wilaya_id"
    t.uuid "moughataa_id"
    t.uuid "commune_id"
    t.uuid "village_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "first_name_fr"
    t.string "last_name_fr"
    t.uuid "bank_id"
    t.string "account_number"
    t.string "pere_prenom_ar"
    t.string "pere_prenom_fr"
    t.index ["bank_id"], name: "index_employees_on_bank_id"
    t.index ["commune_id"], name: "index_employees_on_commune_id"
    t.index ["employee_type_id"], name: "index_employees_on_employee_type_id"
    t.index ["moughataa_id"], name: "index_employees_on_moughataa_id"
    t.index ["nni"], name: "index_employees_on_nni", unique: true
    t.index ["village_id"], name: "index_employees_on_village_id"
    t.index ["wilaya_id"], name: "index_employees_on_wilaya_id"
  end

  create_table "mahdaras", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "employee_id", null: false
    t.string "nom", null: false
    t.string "numero_releve"
    t.string "mahdara_type"
    t.uuid "wilaya_id"
    t.uuid "moughataa_id"
    t.uuid "commune_id"
    t.uuid "village_id"
    t.integer "nombre_etudiants"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["commune_id"], name: "index_mahdaras_on_commune_id"
    t.index ["employee_id"], name: "index_mahdaras_on_employee_id", unique: true
    t.index ["moughataa_id"], name: "index_mahdaras_on_moughataa_id"
    t.index ["village_id"], name: "index_mahdaras_on_village_id"
    t.index ["wilaya_id"], name: "index_mahdaras_on_wilaya_id"
  end

  create_table "moughataa", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.uuid "wilaya_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["wilaya_id"], name: "index_moughataa_on_wilaya_id"
  end

  create_table "payment_batch_employees", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "payment_batch_id", null: false
    t.uuid "employee_id", null: false
    t.integer "months_count", null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["employee_id"], name: "index_payment_batch_employees_on_employee_id"
    t.index ["payment_batch_id", "employee_id"], name: "index_pbe_on_batch_and_employee", unique: true
    t.index ["payment_batch_id"], name: "index_payment_batch_employees_on_payment_batch_id"
  end

  create_table "payment_batches", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.date "payment_date", null: false
    t.string "status", default: "draft", null: false
    t.text "notes"
    t.uuid "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_payment_batches_on_created_by_id"
  end

  create_table "roles", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "description"
    t.text "permissions", default: [], array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_roles_on_name", unique: true
  end

  create_table "salary_amounts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "amount", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["amount"], name: "index_salary_amounts_on_amount", unique: true
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "username", null: false
    t.string "password_digest", null: false
    t.string "role", default: "user", null: false
    t.boolean "active", default: true, null: false
    t.jsonb "permissions", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "role_id"
    t.index ["role_id"], name: "index_users_on_role_id"
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "villages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.uuid "commune_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["commune_id"], name: "index_villages_on_commune_id"
  end

  create_table "wilayas", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "code"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_wilayas_on_name", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "communes", "moughataa"
  add_foreign_key "contracts", "employees"
  add_foreign_key "employees", "banks"
  add_foreign_key "employees", "communes"
  add_foreign_key "employees", "employee_types"
  add_foreign_key "employees", "moughataa"
  add_foreign_key "employees", "villages"
  add_foreign_key "employees", "wilayas"
  add_foreign_key "mahdaras", "communes"
  add_foreign_key "mahdaras", "employees"
  add_foreign_key "mahdaras", "moughataa"
  add_foreign_key "mahdaras", "villages"
  add_foreign_key "mahdaras", "wilayas"
  add_foreign_key "moughataa", "wilayas"
  add_foreign_key "payment_batch_employees", "employees"
  add_foreign_key "payment_batch_employees", "payment_batches"
  add_foreign_key "payment_batches", "users", column: "created_by_id"
  add_foreign_key "users", "roles", on_delete: :nullify
  add_foreign_key "villages", "communes"
end
