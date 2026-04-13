class EmployeeDocument < ApplicationRecord
  belongs_to :employee
  belongs_to :document_template

  has_one_attached :file
end
