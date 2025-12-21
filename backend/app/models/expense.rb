class Expense < ApplicationRecord
  belongs_to :tenant
  belongs_to :car
  belongs_to :expense_category

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :expense_date, presence: true

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_car, ->(car_id) { where(car_id: car_id) }
  scope :recent, -> { order(expense_date: :desc) }

  default_scope -> { order(expense_date: :desc) }
end
