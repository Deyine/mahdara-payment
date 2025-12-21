class ExpenseCategory < ApplicationRecord
  belongs_to :tenant
  has_many :expenses, dependent: :restrict_with_error

  EXPENSE_TYPES = %w[reparation purchase].freeze

  validates :name, presence: true, uniqueness: { scope: :tenant_id }
  validates :expense_type, presence: true, inclusion: { in: EXPENSE_TYPES }

  scope :active, -> { where(active: true) }
  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :reparation, -> { where(expense_type: 'reparation') }
  scope :purchase, -> { where(expense_type: 'purchase') }

  default_scope -> { order(:name) }
end
