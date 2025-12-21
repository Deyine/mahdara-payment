class User < ApplicationRecord
  belongs_to :tenant

  has_secure_password

  ROLES = %w[admin super_admin].freeze

  validates :name, presence: true
  validates :username, presence: true, uniqueness: true
  validates :role, presence: true, inclusion: { in: ROLES }

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :admins, -> { where(role: 'admin') }
  scope :super_admins, -> { where(role: 'super_admin') }

  def super_admin?
    role == 'super_admin'
  end

  def admin?
    role == 'admin'
  end
end
