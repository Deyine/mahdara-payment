class Role < ApplicationRecord
  has_many :users, foreign_key: :role_id, dependent: :nullify

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validate :permissions_are_valid

  private

  def permissions_are_valid
    invalid = (permissions || []) - Permissions::ALL
    errors.add(:permissions, "invalides: #{invalid.join(', ')}") if invalid.any?
  end
end
