class Payment < ApplicationRecord
  belongs_to :tenant
  belongs_to :car
  belongs_to :payment_method, optional: true

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :payment_date, presence: true

  # Validation: Can only create payments for sold cars
  validate :car_must_be_sold

  # Validation: Total payments cannot exceed sale price
  validate :total_payments_cannot_exceed_sale_price, on: :create

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_car, ->(car_id) { where(car_id: car_id) }
  scope :recent, -> { order(payment_date: :desc) }

  default_scope -> { order(payment_date: :desc) }

  private

  def car_must_be_sold
    if car && !car.sold?
      errors.add(:base, 'Payments can only be added to sold cars')
    end
  end

  def total_payments_cannot_exceed_sale_price
    return unless car && car.sold?

    # Calculate what the new total would be if this payment is added
    current_total = car.payments.sum(:amount).to_f
    new_total = current_total + amount.to_f

    if new_total > car.sale_price.to_f
      excess = new_total - car.sale_price.to_f
      errors.add(:amount, "would exceed sale price by #{excess.round(2)} MRU")
    end
  end
end
