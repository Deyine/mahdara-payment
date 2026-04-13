class Api::DocumentTemplatesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { require_permission('employee_types:update') }
  before_action :set_employee_type

  def create
    @template = @employee_type.document_templates.new(template_params)
    if @template.save
      render json: DocumentTemplateSerializer.one(@template), status: :created
    else
      render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @template = @employee_type.document_templates.find(params[:id])
    @template.destroy
    render json: { message: 'تم حذف المستند' }
  end

  private

  def set_employee_type
    @employee_type = EmployeeType.find(params[:employee_type_id])
  end

  def template_params
    params.require(:document_template).permit(:name, :position)
  end
end
