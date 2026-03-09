class Moughataa < ApplicationRecord
  belongs_to :wilaya
  has_many :communes, dependent: :restrict_with_error
  has_many :employees

  validates :name, presence: true
end
