class Api::EmployeeTypesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy]
  before_action :set_employee_type, only: [:show, :update, :destroy]

  def index
    @types = EmployeeType.order(:name)
    render json: @types.map { |t| type_json(t) }
  end

  def show
    render json: type_json(@employee_type)
  end

  def create
    @employee_type = EmployeeType.new(employee_type_params)
    if @employee_type.save
      render json: type_json(@employee_type), status: :created
    else
      render json: { errors: @employee_type.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @employee_type.update(employee_type_params)
      render json: type_json(@employee_type)
    else
      render json: { errors: @employee_type.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @employee_type.employees.any?
      return render json: { error: 'Impossible de supprimer un type ayant des employés' }, status: :unprocessable_entity
    end
    @employee_type.destroy
    render json: { message: 'Type supprimé' }
  end

  private

  def set_employee_type
    @employee_type = EmployeeType.find(params[:id])
  end

  def employee_type_params
    params.require(:employee_type).permit(:name, :active, :is_mahdara)
  end

  def type_json(t)
    { id: t.id, name: t.name, active: t.active, is_mahdara: t.is_mahdara, created_at: t.created_at }
  end
end
