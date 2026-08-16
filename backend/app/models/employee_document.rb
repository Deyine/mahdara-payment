class EmployeeDocument < ApplicationRecord
  has_paper_trail on: [:create, :update, :destroy]

  belongs_to :employee
  belongs_to :document_template

  has_one_attached :file

  def file_attached?
    file.attached?
  end
end
