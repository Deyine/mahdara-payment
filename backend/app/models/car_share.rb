class CarShare < ApplicationRecord
  belongs_to :tenant
  belongs_to :car
  belongs_to :created_by, class_name: 'User'

  validates :token, presence: true, uniqueness: true
  validates :car_id, presence: true

  validate :car_belongs_to_tenant
  validate :created_by_belongs_to_tenant

  before_validation :generate_token, on: :create

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :active, -> { where('expires_at IS NULL OR expires_at > ?', Time.current) }
  scope :expired, -> { where('expires_at IS NOT NULL AND expires_at <= ?', Time.current) }

  def expired?
    expires_at.present? && expires_at <= Time.current
  end

  def active?
    !expired?
  end

  def increment_view_count!
    increment!(:view_count)
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(16)
  end

  def car_belongs_to_tenant
    return unless car.present? && tenant.present?
    errors.add(:car, 'must belong to the same tenant') unless car.tenant_id == tenant_id
  end

  def created_by_belongs_to_tenant
    return unless created_by.present? && tenant.present?
    errors.add(:created_by, 'must belong to the same tenant') unless created_by.tenant_id == tenant_id
  end
end
