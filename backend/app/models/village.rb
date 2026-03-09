class Village < ApplicationRecord
  belongs_to :commune
  has_many :employees

  validates :name, presence: true
end
