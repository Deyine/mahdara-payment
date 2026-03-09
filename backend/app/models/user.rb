class User < ApplicationRecord
  has_secure_password

  ROLES = %w[super_admin admin user].freeze

  validates :username, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role, inclusion: { in: ROLES }

  def admin?
    role == 'admin'
  end

  def super_admin?
    role == 'super_admin'
  end

  def has_permission?(feature)
    return true if admin? || super_admin?
    permissions&.dig(feature.to_s) == true
  end
end
