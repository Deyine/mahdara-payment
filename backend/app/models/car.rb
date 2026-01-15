class Car < ApplicationRecord
  belongs_to :tenant
  belongs_to :car_model
  belongs_to :seller, optional: true
  belongs_to :profit_share_user, class_name: 'User', optional: true
  has_many :expenses, dependent: :restrict_with_error
  has_many :payments, dependent: :restrict_with_error
  has_many :rental_transactions, dependent: :restrict_with_error

  # Active Storage attachments for two photo groups
  has_many_attached :salvage_photos      # Photos from auction/initial state
  has_many_attached :after_repair_photos  # Photos after repairs completed
  has_many_attached :invoices             # Purchase invoices and receipts

  validates :vin, presence: true, uniqueness: { scope: :tenant_id }
  validates :ref, uniqueness: { scope: :tenant_id }, allow_nil: true, numericality: { only_integer: true, greater_than: 0 }, if: -> { ref.present? }
  validates :year, presence: true, numericality: { only_integer: true, greater_than: 1900, less_than_or_equal_to: ->(_) { Date.current.year + 1 } }
  validates :purchase_date, presence: true
  validates :purchase_price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :clearance_cost, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :towing_cost, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :mileage, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

  # Sale and rental validations
  validates :status, presence: true, inclusion: { in: %w[active sold rental] }
  validates :sale_price, numericality: { greater_than: 0 }, if: -> { status == 'sold' }
  validates :sale_date, presence: true, if: -> { status == 'sold' }

  # Rental validations: Cannot have sale_price/sale_date when in rental
  validates :sale_price, absence: true, if: -> { status == 'rental' }
  validates :sale_date, absence: true, if: -> { status == 'rental' }

  # Profit share validations
  validates :profit_share_percentage, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validate :profit_share_user_belongs_to_tenant

  # Photo validations (max 5MB per photo)
  validate :salvage_photos_size_validation
  validate :after_repair_photos_size_validation

  # Invoice validations (max 10MB per invoice, PDF/JPG/PNG only)
  validate :invoices_validation

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :recent, -> { order(Arel.sql('ref ASC NULLS LAST, purchase_date DESC')) }

  # Soft deletion scopes
  scope :active, -> { where(deleted_at: nil) }
  scope :deleted, -> { where.not(deleted_at: nil) }

  # Sale status scopes
  scope :available, -> { where(status: 'active') }
  scope :sold, -> { where(status: 'sold') }
  scope :fully_paid, -> { sold.select { |car| car.fully_paid? } }

  # Rental scopes
  scope :rented, -> { where(status: 'rental') }
  scope :available_for_rental, -> { where(status: 'active') }

  def total_cost
    base = purchase_price.to_f
    base += clearance_cost.to_f if clearance_cost
    base += towing_cost.to_f if towing_cost
    base += expenses.sum(:amount).to_f
    base
  end

  def total_expenses
    expenses.sum(:amount).to_f
  end

  # Sale-related calculations
  def total_paid
    payments.sum(:amount).to_f
  end

  def remaining_balance
    return 0 unless sold?
    (sale_price.to_f - total_paid).round(2)
  end

  def fully_paid?
    return false unless sold?
    total_paid >= sale_price.to_f
  end

  def payment_percentage
    return 0 unless sold? && sale_price.to_f > 0
    ((total_paid / sale_price.to_f) * 100).round(2)
  end

  def profit
    case status
    when 'sold'
      # Sold after rental: sale_price - cost + rental_income
      sale_price.to_f - total_cost + total_rental_income
    when 'rental', 'active'
      # In rental or returned from rental: rental_income - cost
      return nil unless has_rental_history?
      total_rental_income - total_cost
    else
      nil
    end
  end

  # Sale status methods
  def sold?
    status == 'sold'
  end

  def available?
    status == 'active'
  end

  def mark_as_sold!(sale_price, sale_date = Date.current)
    update!(
      status: 'sold',
      sale_price: sale_price,
      sale_date: sale_date
    )
  end

  def mark_as_available!
    # Can only revert to active if no payments have been made
    if payments.any?
      errors.add(:base, 'Cannot mark as available: car has payments recorded')
      return false
    end

    # Close any active rentals before reverting to active
    if active_rental
      errors.add(:base, 'Cannot mark as available: car has an active rental')
      return false
    end

    update!(
      status: 'active',
      sale_price: nil,
      sale_date: nil
    )
  end

  # Rental status methods
  def rented?
    status == 'rental'
  end

  def mark_as_rental!
    # Can only mark as rental if currently active
    unless available?
      errors.add(:base, 'Can only rent available cars')
      return false
    end

    update!(status: 'rental')
  end

  def return_from_rental!
    # Can only return if currently rented
    unless rented?
      errors.add(:base, 'Car is not currently rented')
      return false
    end

    update!(status: 'active')
  end

  # Rental calculations
  def total_rental_income
    rental_transactions.where(status: ['active', 'completed']).sum(:amount).to_f
  end

  def active_rental
    rental_transactions.find_by(status: 'active', end_date: nil)
  end

  def has_rental_history?
    rental_transactions.any?
  end

  def rental_break_even?
    return false unless has_rental_history?
    total_rental_income >= total_cost
  end

  # Profit share calculations
  def has_profit_share?
    profit_share_user_id.present? && profit_share_percentage.to_f > 0
  end

  def user_profit_amount
    return 0 unless has_profit_share? && profit
    (profit * profit_share_percentage.to_f / 100).round(2)
  end

  def company_net_profit
    return profit unless has_profit_share?
    return nil unless profit
    (profit - user_profit_amount).round(2)
  end

  # Soft deletion methods
  def soft_delete!
    update(deleted_at: Time.current)
  end

  def restore!
    update(deleted_at: nil)
  end

  def deleted?
    deleted_at.present?
  end

  private

  def salvage_photos_size_validation
    validate_photos_size(salvage_photos, 'Salvage photos')
  end

  def after_repair_photos_size_validation
    validate_photos_size(after_repair_photos, 'After repair photos')
  end

  def validate_photos_size(photos, group_name)
    photos.each do |photo|
      if photo.byte_size > 5.megabytes
        errors.add(:base, "#{group_name}: #{photo.filename} must be less than 5MB")
      end
    end
  end

  def invoices_validation
    invoices.each do |invoice|
      # Validate file size (max 10MB)
      if invoice.byte_size > 10.megabytes
        errors.add(:base, "Invoice #{invoice.filename} must be less than 10MB")
      end

      # Validate content type (PDF, JPG, PNG only)
      allowed_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      unless allowed_types.include?(invoice.content_type)
        errors.add(:base, "Invoice #{invoice.filename} must be PDF, JPG, or PNG format")
      end
    end
  end

  def profit_share_user_belongs_to_tenant
    return unless profit_share_user_id.present?
    return if profit_share_user&.tenant_id == tenant_id
    errors.add(:profit_share_user, 'must belong to the same tenant')
  end
end
