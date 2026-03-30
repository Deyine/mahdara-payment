class EmployeeType < ApplicationRecord
  has_many :employees, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
  validate :cannot_unset_is_mahdara_with_existing_mahdara_employees

  scope :active, -> { where(active: true) }

  private

  def cannot_unset_is_mahdara_with_existing_mahdara_employees
    return unless persisted? && is_mahdara_changed? && !is_mahdara
    if employees.joins(:mahdara).any?
      errors.add(:is_mahdara, 'لا يمكن إلغاء تحديد المحظرة، يوجد موظفون من هذا النوع لديهم بيانات محظرة')
    end
  end
end
