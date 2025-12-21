class Seller < ApplicationRecord
  belongs_to :tenant
  has_many :cars, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :tenant_id }
  validates :tenant_id, presence: true

  scope :active, -> { where(active: true) }
  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }

  def as_json(options = {})
    super(options.merge(only: [:id, :name, :location, :active, :created_at, :updated_at]))
  end
end
