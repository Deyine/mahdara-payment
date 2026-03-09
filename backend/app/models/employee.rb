class Employee < ApplicationRecord
  belongs_to :employee_type
  belongs_to :wilaya, optional: true
  belongs_to :moughataa, optional: true
  belongs_to :commune, optional: true
  belongs_to :village, optional: true
  belongs_to :bank, optional: true

  has_many :contracts, dependent: :destroy
  has_many :payment_batch_employees, dependent: :restrict_with_error

  validates :nni, presence: true, uniqueness: true
  validates :first_name, presence: true
  validates :last_name, presence: true

  scope :active, -> { where(active: true) }

  def active_contract
    contracts.find_by(active: true)
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def full_name_fr
    "#{first_name_fr} #{last_name_fr}"
  end
end
