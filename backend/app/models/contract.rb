class Contract < ApplicationRecord
  has_paper_trail on: [:create, :update, :destroy]

  belongs_to :employee

  CONTRACT_TYPES = %w[CDI CDD].freeze

  validates :contract_type, inclusion: { in: CONTRACT_TYPES }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :start_date, presence: true
  validates :duration_months, presence: true, if: -> { contract_type == 'CDD' }

  before_create :assign_reference

  private

  def assign_reference
    year = Time.current.year
    next_num = Contract.where("date_part('year', created_at) = ?", year).count + 1
    self.reference = format('%04d/%d', next_num, year)
  end
end
