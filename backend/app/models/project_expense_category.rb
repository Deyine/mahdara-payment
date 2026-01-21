class ProjectExpenseCategory < ApplicationRecord
  belongs_to :tenant
  has_many :project_expenses, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :tenant_id }

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :active, -> { where(active: true) }

  default_scope -> { order(:name) }

  def as_json(options = {})
    super(options.merge(only: [:id, :name, :description, :active, :created_at, :updated_at]))
  end
end
