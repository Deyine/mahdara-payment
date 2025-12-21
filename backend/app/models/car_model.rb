class CarModel < ApplicationRecord
  belongs_to :tenant
  has_many :cars, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :tenant_id }

  scope :active, -> { where(active: true) }
  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }

  default_scope -> { order(:name) }
end
