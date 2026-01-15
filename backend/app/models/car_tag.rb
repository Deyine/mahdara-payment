class CarTag < ApplicationRecord
  belongs_to :car
  belongs_to :tag

  validates :car_id, uniqueness: { scope: :tag_id }
end
