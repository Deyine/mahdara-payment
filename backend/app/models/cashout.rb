class Cashout < ApplicationRecord
  belongs_to :tenant
  belongs_to :user

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :cashout_date, presence: true
  validates :user_id, presence: true
  validates :tenant_id, presence: true

  # Validation: User must belong to the same tenant
  validate :user_belongs_to_tenant

  # Validation: User must be a manager (has cars with profit share)
  validate :user_must_be_manager

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :recent, -> { order(cashout_date: :desc) }

  default_scope -> { order(cashout_date: :desc) }

  private

  def user_belongs_to_tenant
    if user_id.present? && tenant_id.present?
      user = User.find_by(id: user_id)
      unless user && user.tenant_id == tenant_id
        errors.add(:user_id, 'must belong to the same tenant')
      end
    end
  end

  def user_must_be_manager
    if user_id.present?
      user = User.find_by(id: user_id)
      unless user && user.manager?
        errors.add(:user_id, 'must be a manager')
      end
    end
  end
end
