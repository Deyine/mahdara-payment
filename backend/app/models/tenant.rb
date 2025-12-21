class Tenant < ApplicationRecord
  has_many :users, dependent: :restrict_with_error
  has_many :car_models, dependent: :restrict_with_error
  has_many :cars, dependent: :restrict_with_error
  has_many :expense_categories, dependent: :restrict_with_error
  has_many :expenses, dependent: :restrict_with_error

  validates :name, presence: true
  validates :subdomain, uniqueness: true, allow_nil: true

  scope :active, -> { where(active: true) }
end
