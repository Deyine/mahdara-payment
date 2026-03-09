class PaymentBatchEmployee < ApplicationRecord
  belongs_to :payment_batch
  belongs_to :employee

  validates :months_count, presence: true, numericality: { greater_than: 0 }
  validates :amount, presence: true, numericality: { greater_than: 0 }
end
