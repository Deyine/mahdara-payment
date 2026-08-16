class Employee < ApplicationRecord
  has_paper_trail on: [:create, :update, :destroy]

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
  has_many :employee_documents

  after_create :sync_document_slots
  before_destroy :destroy_employee_documents_silently

  validates :nni, presence: true, uniqueness: true
  validates :first_name, presence: true
  validates :last_name, presence: true

  scope :active, -> { where(active: true) }

  def sync_document_slots
    return unless employee_type
    existing_ids = employee_documents.pluck(:document_template_id)
    # System-generated placeholder slots, not a user action — keep them out of the audit trail.
    PaperTrail.request(enabled: false) do
      employee_type.document_templates.each do |template|
        employee_documents.create!(document_template: template) unless existing_ids.include?(template.id)
      end
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

  private

  # System-managed slots, not a user action — keep the cascade out of the audit trail
  # (their creation is already silenced in #sync_document_slots).
  def destroy_employee_documents_silently
    PaperTrail.request(enabled: false) { employee_documents.destroy_all }
  end
end
