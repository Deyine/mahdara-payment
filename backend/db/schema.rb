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

ActiveRecord::Schema[8.0].define(version: 2026_02_07_132053) do
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

  create_table "car_shares", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.uuid "car_id", null: false
    t.bigint "created_by_id", null: false
    t.string "token", null: false
    t.boolean "show_costs", default: false, null: false
    t.boolean "show_expenses", default: false, null: false
    t.datetime "expires_at"
    t.integer "view_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["car_id", "tenant_id"], name: "index_car_shares_on_car_id_and_tenant_id"
    t.index ["car_id"], name: "index_car_shares_on_car_id"
    t.index ["created_by_id"], name: "index_car_shares_on_created_by_id"
    t.index ["expires_at"], name: "index_car_shares_on_expires_at"
    t.index ["tenant_id"], name: "index_car_shares_on_tenant_id"
    t.index ["token"], name: "index_car_shares_on_token", unique: true
  end

  create_table "car_tags", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "car_id", null: false
    t.uuid "tag_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["car_id", "tag_id"], name: "index_car_tags_on_car_id_and_tag_id", unique: true
    t.index ["car_id"], name: "index_car_tags_on_car_id"
    t.index ["tag_id"], name: "index_car_tags_on_tag_id"
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
    t.string "status", default: "active", null: false
    t.decimal "sale_price", precision: 10, scale: 2
    t.date "sale_date"
    t.integer "ref"
    t.bigint "profit_share_user_id"
    t.decimal "profit_share_percentage", precision: 5, scale: 2, default: "0.0"
    t.boolean "published", default: false, null: false
    t.decimal "listing_price", precision: 10, scale: 2
    t.index ["car_model_id"], name: "index_cars_on_car_model_id"
    t.index ["deleted_at"], name: "index_cars_on_deleted_at"
    t.index ["profit_share_user_id"], name: "index_cars_on_profit_share_user_id"
    t.index ["published"], name: "index_cars_on_published"
    t.index ["purchase_date"], name: "index_cars_on_purchase_date"
    t.index ["seller_id"], name: "index_cars_on_seller_id"
    t.index ["status"], name: "index_cars_on_status"
    t.index ["tenant_id", "ref"], name: "index_cars_on_tenant_id_and_ref", unique: true
    t.index ["tenant_id", "vin"], name: "index_cars_on_tenant_id_and_vin", unique: true
    t.index ["tenant_id"], name: "index_cars_on_tenant_id"
  end

  create_table "cashouts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.bigint "user_id", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.date "cashout_date", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cashout_date"], name: "index_cashouts_on_cashout_date"
    t.index ["tenant_id"], name: "index_cashouts_on_tenant_id"
    t.index ["user_id"], name: "index_cashouts_on_user_id"
  end

  create_table "debts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.string "debtor_name", null: false
    t.bigint "user_id"
    t.string "direction", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.date "debt_date", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["debt_date"], name: "index_debts_on_debt_date"
    t.index ["direction"], name: "index_debts_on_direction"
    t.index ["tenant_id"], name: "index_debts_on_tenant_id"
    t.index ["user_id"], name: "index_debts_on_user_id"
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

  create_table "payment_methods", force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.string "name", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_payment_methods_on_active"
    t.index ["tenant_id", "name"], name: "index_payment_methods_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_payment_methods_on_tenant_id"
  end

  create_table "payments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.uuid "car_id", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.date "payment_date", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "payment_method_id"
    t.index ["car_id", "payment_date"], name: "index_payments_on_car_id_and_payment_date"
    t.index ["car_id"], name: "index_payments_on_car_id"
    t.index ["payment_date"], name: "index_payments_on_payment_date"
    t.index ["payment_method_id"], name: "index_payments_on_payment_method_id"
    t.index ["tenant_id"], name: "index_payments_on_tenant_id"
  end

  create_table "project_expense_categories", force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.string "name", null: false
    t.text "description"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_project_expense_categories_on_active"
    t.index ["tenant_id", "name"], name: "index_project_expense_categories_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_project_expense_categories_on_tenant_id"
  end

  create_table "project_expenses", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.uuid "project_id", null: false
    t.integer "project_expense_category_id", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.date "expense_date", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expense_date"], name: "index_project_expenses_on_expense_date"
    t.index ["project_expense_category_id"], name: "index_project_expenses_on_project_expense_category_id"
    t.index ["project_id", "expense_date"], name: "index_project_expenses_on_project_id_and_expense_date"
    t.index ["project_id"], name: "index_project_expenses_on_project_id"
    t.index ["tenant_id"], name: "index_project_expenses_on_tenant_id"
  end

  create_table "projects", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.string "name", null: false
    t.text "description"
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id", "name"], name: "index_projects_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_projects_on_tenant_id"
  end

  create_table "rental_transactions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "tenant_id", null: false
    t.uuid "car_id", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "locataire", null: false
    t.date "rental_date", null: false
    t.integer "days", null: false
    t.decimal "daily_rate", precision: 10, scale: 2, null: false
    t.bigint "profit_share_user_id"
    t.decimal "profit_per_day", precision: 10, scale: 2, default: "0.0"
    t.index ["car_id"], name: "index_rental_transactions_on_car_id"
    t.index ["profit_share_user_id"], name: "index_rental_transactions_on_profit_share_user_id"
    t.index ["rental_date"], name: "index_rental_transactions_on_rental_date"
    t.index ["tenant_id"], name: "index_rental_transactions_on_tenant_id"
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

  create_table "tags", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "color", default: "#167bff"
    t.uuid "tenant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id", "name"], name: "index_tags_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_tags_on_tenant_id"
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
    t.boolean "active", default: true, null: false
    t.index ["tenant_id", "role"], name: "index_users_on_tenant_id_and_role"
    t.index ["tenant_id"], name: "index_users_on_tenant_id"
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "car_models", "tenants"
  add_foreign_key "car_shares", "cars"
  add_foreign_key "car_shares", "tenants"
  add_foreign_key "car_shares", "users", column: "created_by_id"
  add_foreign_key "car_tags", "cars"
  add_foreign_key "car_tags", "tags"
  add_foreign_key "cars", "car_models"
  add_foreign_key "cars", "sellers"
  add_foreign_key "cars", "tenants"
  add_foreign_key "cars", "users", column: "profit_share_user_id"
  add_foreign_key "cashouts", "tenants"
  add_foreign_key "cashouts", "users"
  add_foreign_key "debts", "tenants"
  add_foreign_key "debts", "users"
  add_foreign_key "expense_categories", "tenants"
  add_foreign_key "expenses", "cars"
  add_foreign_key "expenses", "expense_categories"
  add_foreign_key "expenses", "tenants"
  add_foreign_key "payment_methods", "tenants"
  add_foreign_key "payments", "cars"
  add_foreign_key "payments", "payment_methods"
  add_foreign_key "payments", "tenants"
  add_foreign_key "project_expense_categories", "tenants"
  add_foreign_key "project_expenses", "project_expense_categories"
  add_foreign_key "project_expenses", "projects"
  add_foreign_key "project_expenses", "tenants"
  add_foreign_key "projects", "tenants"
  add_foreign_key "rental_transactions", "cars"
  add_foreign_key "rental_transactions", "tenants"
  add_foreign_key "rental_transactions", "users", column: "profit_share_user_id"
  add_foreign_key "sellers", "tenants"
  add_foreign_key "tags", "tenants"
  add_foreign_key "users", "tenants"
end
