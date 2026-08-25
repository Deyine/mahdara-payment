class BatchExport < ApplicationRecord
  belongs_to :requested_by, class_name: 'User', optional: true
  belongs_to :wilaya, optional: true

  has_one_attached :zip_file

  STATUSES = %w[pending processing done failed].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :recruitment_batch, presence: true
  validates :niveau, inclusion: { in: Mahdara::NIVEAUX }, allow_nil: true
end
