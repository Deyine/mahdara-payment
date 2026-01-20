class Debt < ApplicationRecord
  belongs_to :tenant
  belongs_to :user, optional: true

  DIRECTIONS = %w[we_lent we_borrowed].freeze

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :debt_date, presence: true
  validates :debtor_name, presence: true
  validates :tenant_id, presence: true
  validates :direction, presence: true, inclusion: { in: DIRECTIONS }

  # Validation: If user_id is provided, user must belong to the same tenant
  validate :user_belongs_to_tenant, if: -> { user_id.present? }

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :we_lent, -> { where(direction: 'we_lent') }
  scope :we_borrowed, -> { where(direction: 'we_borrowed') }
  scope :recent, -> { order(debt_date: :desc) }

  default_scope -> { order(debt_date: :desc) }

  # They owe us money
  def we_lent?
    direction == 'we_lent'
  end

  # We owe them money
  def we_borrowed?
    direction == 'we_borrowed'
  end

  private

  def user_belongs_to_tenant
    user = User.find_by(id: user_id)
    unless user && user.tenant_id == tenant_id
      errors.add(:user_id, 'must belong to the same tenant')
    end
  end
end
