class Wilaya < ApplicationRecord
  has_many :moughataa, dependent: :restrict_with_error
  has_many :employees

  validates :name, presence: true, uniqueness: true
end
