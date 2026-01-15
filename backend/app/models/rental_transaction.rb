class RentalTransaction < ApplicationRecord
  belongs_to :tenant
  belongs_to :car

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :start_date, presence: true
  validates :renter_name, presence: true
  validates :status, presence: true, inclusion: { in: %w[active completed cancelled] }
  validates :billing_frequency, inclusion: { in: %w[daily weekly monthly] }, allow_nil: true

  # Validation: Car must be in rental status when creating rental transaction
  validate :car_must_be_rented, on: :create

  # Validation: End date must be after start date
  validate :end_date_after_start_date, if: -> { end_date.present? }

  # Validation: No overlapping active rentals for the same car
  validate :no_overlapping_rentals, on: :create

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_car, ->(car_id) { where(car_id: car_id) }
  scope :active, -> { where(status: 'active') }
  scope :completed, -> { where(status: 'completed') }
  scope :recent, -> { order(start_date: :desc) }

  default_scope -> { order(start_date: :desc) }

  def active?
    status == 'active'
  end

  def complete!(end_date = Date.current)
    update!(
      status: 'completed',
      end_date: end_date
    )
  end

  def duration_days
    return nil unless end_date
    (end_date - start_date).to_i
  end

  private

  def car_must_be_rented
    if car && !car.rented?
      errors.add(:base, 'Rental transactions can only be added to cars with rental status')
    end
  end

  def end_date_after_start_date
    if end_date <= start_date
      errors.add(:end_date, 'must be after start date')
    end
  end

  def no_overlapping_rentals
    return unless car

    overlapping = car.rental_transactions.active.where.not(id: id)
    if overlapping.any?
      errors.add(:base, 'Car already has an active rental transaction')
    end
  end
end
