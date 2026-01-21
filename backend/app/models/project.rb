class Project < ApplicationRecord
  belongs_to :tenant
  has_many :project_expenses, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :tenant_id }

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :active, -> { where(active: true) }

  default_scope -> { order(:name) }

  # Calculate total expenses for this project
  def total_expenses
    project_expenses.sum(:amount).to_f
  end

  # Simple as_json for API responses
  def as_json(options = {})
    super(options).merge(
      total_expenses: total_expenses,
      expense_count: project_expenses.count
    )
  end
end
