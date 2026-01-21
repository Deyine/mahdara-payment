class Tenant < ApplicationRecord
  has_many :users, dependent: :restrict_with_error
  has_many :car_models, dependent: :restrict_with_error
  has_many :cars, dependent: :restrict_with_error
  has_many :expense_categories, dependent: :restrict_with_error
  has_many :expenses, dependent: :restrict_with_error
  has_many :tags, dependent: :restrict_with_error
  has_many :debts, dependent: :destroy
  has_many :projects, dependent: :destroy
  has_many :project_expense_categories, dependent: :destroy
  has_many :project_expenses, dependent: :destroy

  validates :name, presence: true
  validates :subdomain, uniqueness: true, allow_nil: true

  scope :active, -> { where(active: true) }
end
