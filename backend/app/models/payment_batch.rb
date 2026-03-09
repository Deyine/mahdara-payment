class PaymentBatch < ApplicationRecord
  belongs_to :created_by, class_name: 'User', foreign_key: :created_by_id
  has_many :payment_batch_employees, dependent: :destroy
  has_many :employees, through: :payment_batch_employees

  STATUSES = %w[draft confirmed].freeze

  validates :payment_date, presence: true
  validates :status, inclusion: { in: STATUSES }

  def draft?
    status == 'draft'
  end

  def confirmed?
    status == 'confirmed'
  end
end
