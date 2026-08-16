class Village < ApplicationRecord
  has_paper_trail on: [:create, :update, :destroy]

  belongs_to :commune
  has_many :employees

  validates :name, presence: true
end
