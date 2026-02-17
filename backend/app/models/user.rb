class User < ApplicationRecord
  belongs_to :tenant
  has_many :debts, dependent: :nullify

  has_secure_password

  ROLES = %w[admin super_admin manager].freeze

  validates :name, presence: true
  validates :username, presence: true, uniqueness: true
  validates :role, presence: true, inclusion: { in: ROLES }

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :admins, -> { where(role: 'admin') }
  scope :super_admins, -> { where(role: 'super_admin') }
  scope :managers, -> { where(role: 'manager') }
  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }

  def super_admin?
    role == 'super_admin'
  end

  def admin?
    role == 'admin'
  end

  def manager?
    role == 'manager'
  end

  def can_write?
    admin? || super_admin?
  end

  def can_read?
    admin? || super_admin? || manager?
  end

  def has_permission?(feature)
    return true if admin? || super_admin?

    permissions.is_a?(Hash) && permissions[feature.to_s] == true
  end

  def time_tracking?
    has_permission?(:time_tracking)
  end
end
