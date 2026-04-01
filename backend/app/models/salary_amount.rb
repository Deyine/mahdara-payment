class SalaryAmount < ApplicationRecord
  validates :amount, presence: true, numericality: { only_integer: true, greater_than: 0 }, uniqueness: true
end
