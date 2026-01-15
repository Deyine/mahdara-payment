class Tag < ApplicationRecord
  belongs_to :tenant
  has_many :car_tags, dependent: :destroy
  has_many :cars, through: :car_tags

  validates :name, presence: true, uniqueness: { scope: :tenant_id }
  validates :color, format: { with: /\A#[0-9A-Fa-f]{6}\z/, message: "must be a valid hex color (e.g., #167bff)" }, allow_nil: true

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }

  default_scope -> { order(:name) }
end
