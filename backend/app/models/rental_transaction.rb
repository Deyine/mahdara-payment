class RentalTransaction < ApplicationRecord
  belongs_to :tenant
  belongs_to :car

  validates :locataire, presence: true
  validates :rental_date, presence: true
  validates :days, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :daily_rate, presence: true, numericality: { greater_than: 0 }
  validates :amount, presence: true, numericality: { greater_than: 0 }

  # Validation: Car must be in rental status when creating rental transaction
  validate :car_must_be_rental, on: :create

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_car, ->(car_id) { where(car_id: car_id) }
  scope :recent, -> { order(rental_date: :desc) }

  default_scope -> { order(rental_date: :desc) }

  # Auto-calculate amount before validation
  before_validation :calculate_amount

  private

  def car_must_be_rental
    if car && car.status != 'rental'
      errors.add(:base, 'Rental transactions can only be added to cars with rental status')
    end
  end

  def calculate_amount
    if days.present? && daily_rate.present?
      self.amount = days * daily_rate.to_f
    end
  end
end
