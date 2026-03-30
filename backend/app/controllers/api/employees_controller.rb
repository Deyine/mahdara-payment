class Api::EmployeesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy]
  before_action :set_employee, only: [:show, :update, :destroy]

  def index
    @employees = Employee.includes(:employee_type, :wilaya, :moughataa, :commune, :village, :bank, :contracts,
                                   mahdara: [:wilaya, :moughataa, :commune, :village, mahl_ilmi_attachment: :blob])
                         .order(:last_name, :first_name)
    render json: EmployeeSerializer.many(@employees)
  end

  def show
    render json: EmployeeSerializer.one(@employee, full: true)
  end

  def lookup_nni
    nni = params[:nni].to_s.strip
    return render json: { error: 'NNI requis' }, status: :bad_request if nni.blank?

    person = HuwiyetiService.new.get_person_by_nni(nni)
    render json: person.merge(source: 'gov_api')
  rescue StandardError => e
    render json: { error: e.message }, status: :not_found
  end

  def create
    @employee = Employee.new(employee_params)
    if @employee.save
      render json: EmployeeSerializer.one(@employee), status: :created
    else
      render json: { errors: @employee.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @employee.update(employee_update_params)
      render json: EmployeeSerializer.one(@employee)
    else
      render json: { errors: @employee.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @employee.payment_batch_employees.any?
      return render json: { error: 'Impossible de supprimer un employé ayant des paiements' }, status: :unprocessable_entity
    end
    @employee.destroy
    render json: { message: 'Employé supprimé' }
  end

  private

  def set_employee
    @employee = Employee.includes(:employee_type, :wilaya, :moughataa, :commune, :village, :bank, :contracts,
                                  mahdara: [:wilaya, :moughataa, :commune, :village, mahl_ilmi_attachment: :blob]).find(params[:id])
  end

  def employee_params
    params.require(:employee).permit(:nni, :first_name, :last_name, :first_name_fr, :last_name_fr,
                                     :birth_date, :phone, :employee_type_id, :wilaya_id,
                                     :moughataa_id, :commune_id, :village_id, :active,
                                     :bank_id, :account_number)
  end

  def employee_update_params
    params.require(:employee).permit(:phone, :employee_type_id, :wilaya_id, :moughataa_id, :commune_id, :village_id, :active,
                                     :bank_id, :account_number)
  end
end
