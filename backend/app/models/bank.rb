class Bank < ApplicationRecord
  has_paper_trail on: [:create, :update, :destroy]

  has_many :employees, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true

  scope :active, -> { where(active: true) }
end
