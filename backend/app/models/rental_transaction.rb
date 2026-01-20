class RentalTransaction < ApplicationRecord
  belongs_to :tenant
  belongs_to :car
  belongs_to :profit_share_user, class_name: 'User', optional: true

  validates :locataire, presence: true
  validates :rental_date, presence: true
  validates :days, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :daily_rate, presence: true, numericality: { greater_than: 0 }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :profit_per_day, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Validation: Car must be in rental status when creating rental transaction
  validate :car_must_be_rental, on: :create
  validate :profit_share_user_belongs_to_tenant

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_car, ->(car_id) { where(car_id: car_id) }
  scope :recent, -> { order(rental_date: :desc) }

  default_scope -> { order(rental_date: :desc) }

  # Auto-calculate amount before validation
  before_validation :calculate_amount

  # Check if this rental has profit share configured
  def has_profit_share?
    profit_share_user_id.present? && profit_per_day.to_f > 0
  end

  # Calculate manager's profit amount
  def user_profit_amount
    return 0 unless has_profit_share?
    (days.to_i * profit_per_day.to_f).round(2)
  end

  # Calculate company's net profit (rental amount minus manager's profit)
  def company_net_profit
    return amount.to_f unless has_profit_share?
    (amount.to_f - user_profit_amount).round(2)
  end

  private

  def car_must_be_rental
    if car && car.status != 'rental'
      errors.add(:base, 'Rental transactions can only be added to cars with rental status')
    end
  end

  def profit_share_user_belongs_to_tenant
    if profit_share_user_id.present?
      user = User.find_by(id: profit_share_user_id)
      unless user && user.tenant_id == tenant_id
        errors.add(:profit_share_user_id, 'must belong to the same tenant')
      end
    end
  end

  def calculate_amount
    if days.present? && daily_rate.present?
      self.amount = days * daily_rate.to_f
    end
  end
end
