class PaymentMethod < ApplicationRecord
  belongs_to :tenant
  has_many :payments, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :tenant_id }
  validates :active, inclusion: { in: [true, false] }

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }

  default_scope -> { order(name: :asc) }
end
