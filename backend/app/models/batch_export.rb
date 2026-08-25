class BatchExport < ApplicationRecord
  belongs_to :requested_by, class_name: 'User', optional: true

  has_one_attached :zip_file

  STATUSES = %w[pending processing done failed].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :recruitment_batch, presence: true
end
