class Mahdara < ApplicationRecord
  belongs_to :employee
  belongs_to :wilaya, optional: true
  belongs_to :moughataa, optional: true
  belongs_to :commune, optional: true
  belongs_to :village, optional: true

  has_one_attached :mahl_ilmi

  TYPES = %w[jamia mutakhassisa quraniya awwaliya].freeze

  validates :nom, presence: true
  validates :mahdara_type, inclusion: { in: TYPES }, allow_nil: true
end
