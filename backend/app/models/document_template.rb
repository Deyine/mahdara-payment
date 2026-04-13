class DocumentTemplate < ApplicationRecord
  belongs_to :employee_type
  has_many :employee_documents, dependent: :destroy

  validates :name, presence: true
  validates :name, uniqueness: { scope: :employee_type_id }

  default_scope { order(:position, :name) }

  before_destroy :detach_uploaded_files

  private

  def detach_uploaded_files
    employee_documents.each { |ed| ed.file.detach if ed.file.attached? }
  end
end
