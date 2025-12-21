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

ActiveRecord::Schema[8.0].define(version: 2025_12_21_191953) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

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

  create_table "car_models", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.boolean "active", default: true, null: false
    t.uuid "tenant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_car_models_on_active"
    t.index ["tenant_id", "name"], name: "index_car_models_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_car_models_on_tenant_id"
  end

  create_table "cars", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "vin", null: false
    t.uuid "car_model_id", null: false
    t.integer "year", null: false
    t.string "color"
    t.integer "mileage"
    t.date "purchase_date", null: false
    t.decimal "purchase_price", precision: 10, scale: 2, null: false
    t.decimal "clearance_cost", precision: 10, scale: 2
    t.decimal "towing_cost", precision: 10, scale: 2
    t.uuid "tenant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.uuid "seller_id"
    t.index ["car_model_id"], name: "index_cars_on_car_model_id"
    t.index ["deleted_at"], name: "index_cars_on_deleted_at"
    t.index ["purchase_date"], name: "index_cars_on_purchase_date"
    t.index ["seller_id"], name: "index_cars_on_seller_id"
    t.index ["tenant_id", "vin"], name: "index_cars_on_tenant_id_and_vin", unique: true
    t.index ["tenant_id"], name: "index_cars_on_tenant_id"
  end

  create_table "expense_categories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "expense_type", null: false
    t.boolean "active", default: true, null: false
    t.uuid "tenant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_expense_categories_on_active"
    t.index ["expense_type"], name: "index_expense_categories_on_expense_type"
    t.index ["tenant_id", "name"], name: "index_expense_categories_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_expense_categories_on_tenant_id"
  end

  create_table "expenses", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "car_id", null: false
    t.uuid "expense_category_id", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.text "description"
    t.date "expense_date", null: false
    t.uuid "tenant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["car_id"], name: "index_expenses_on_car_id"
    t.index ["expense_category_id"], name: "index_expenses_on_expense_category_id"
    t.index ["expense_date"], name: "index_expenses_on_expense_date"
    t.index ["tenant_id", "car_id"], name: "index_expenses_on_tenant_id_and_car_id"
    t.index ["tenant_id"], name: "index_expenses_on_tenant_id"
  end

  create_table "sellers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.string "name", null: false
    t.string "location"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_sellers_on_active"
    t.index ["tenant_id", "name"], name: "index_sellers_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_sellers_on_tenant_id"
  end

  create_table "tenants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "subdomain"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_tenants_on_active"
    t.index ["subdomain"], name: "index_tenants_on_subdomain", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "username", null: false
    t.string "password_digest", null: false
    t.string "role", null: false
    t.uuid "tenant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id", "role"], name: "index_users_on_tenant_id_and_role"
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "car_models", "tenants"
  add_foreign_key "cars", "car_models"
  add_foreign_key "cars", "sellers"
  add_foreign_key "cars", "tenants"
  add_foreign_key "expense_categories", "tenants"
  add_foreign_key "expenses", "cars"
  add_foreign_key "expenses", "expense_categories"
  add_foreign_key "expenses", "tenants"
  add_foreign_key "sellers", "tenants"
  add_foreign_key "users", "tenants"
end
