class User < ApplicationRecord
  has_secure_password

  ROLES = %w[super_admin user].freeze

  # Note: 'assigned_role' avoids collision with the 'role' string column
  belongs_to :assigned_role, class_name: 'Role', foreign_key: :role_id, optional: true

  validates :username, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role, inclusion: { in: ROLES }

  def super_admin?
    role == 'super_admin'
  end

  def has_permission?(permission)
    return true if super_admin?
    assigned_role&.permissions&.include?(permission.to_s) == true
  end
end
