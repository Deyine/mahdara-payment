class Contract < ApplicationRecord
  belongs_to :employee

  CONTRACT_TYPES = %w[CDI CDD].freeze

  validates :contract_type, inclusion: { in: CONTRACT_TYPES }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :start_date, presence: true
  validates :duration_months, presence: true, if: -> { contract_type == 'CDD' }
end
