class Employee < ApplicationRecord
  belongs_to :employee_type
  belongs_to :wilaya, optional: true
  belongs_to :moughataa, optional: true
  belongs_to :commune, optional: true
  belongs_to :village, optional: true
  belongs_to :bank, optional: true

  has_one_attached :photo

  has_many :contracts, dependent: :destroy
  has_many :payment_batch_employees, dependent: :restrict_with_error
  has_one :mahdara, dependent: :destroy
  has_many :employee_documents, dependent: :destroy

  after_create :generate_employee_documents

  validates :nni, presence: true, uniqueness: true
  validates :first_name, presence: true
  validates :last_name, presence: true

  scope :active, -> { where(active: true) }

  def sync_document_slots
    return unless employee_type
    existing_ids = employee_documents.pluck(:document_template_id)
    employee_type.document_templates.each do |template|
      employee_documents.create!(document_template: template) unless existing_ids.include?(template.id)
    end
  end

  def active_contract
    contracts.find_by(active: true)
  end

  def full_name
    [first_name, pere_prenom_ar, last_name].reject(&:blank?).join(' ')
  end

  def full_name_fr
    [first_name_fr, pere_prenom_fr, last_name_fr].reject(&:blank?).join(' ')
  end
end
