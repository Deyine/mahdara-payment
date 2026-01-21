class ProjectExpense < ApplicationRecord
  belongs_to :tenant
  belongs_to :project
  belongs_to :project_expense_category

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :expense_date, presence: true

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_project, ->(project_id) { where(project_id: project_id) }
  scope :recent, -> { order(expense_date: :desc) }

  default_scope -> { order(expense_date: :desc) }

  def as_json(options = {})
    super(options).merge(
      project_expense_category: project_expense_category.as_json,
      project: project ? { id: project.id, name: project.name } : nil
    )
  end
end
