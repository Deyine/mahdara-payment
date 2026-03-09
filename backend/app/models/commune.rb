class Commune < ApplicationRecord
  belongs_to :moughataa
  has_many :villages, dependent: :restrict_with_error
  has_many :employees

  validates :name, presence: true
end
