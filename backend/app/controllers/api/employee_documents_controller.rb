class Api::EmployeeDocumentsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { require_permission('employees:update') }
  before_action :set_employee
  before_action :set_employee_document, only: [:update, :destroy]

  def update
    if params[:employee_document][:file].present?
      @employee_document.file.detach if @employee_document.file.attached?
      @employee_document.file.attach(params[:employee_document][:file])
    end

    if @employee_document.save
      render json: EmployeeDocumentSerializer.one(@employee_document)
    else
      render json: { errors: @employee_document.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @employee_document.file.detach if @employee_document.file.attached?
    @employee_document.destroy
    render json: { message: 'تم حذف المستند' }
  end

  private

  def set_employee
    @employee = Employee.find(params[:employee_id])
  end

  def set_employee_document
    @employee_document = @employee.employee_documents.find(params[:id])
  end
end
