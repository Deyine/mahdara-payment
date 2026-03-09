class Api::EmployeesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy]
  before_action :set_employee, only: [:show, :update, :destroy]

  def index
    @employees = Employee.includes(:employee_type, :wilaya, :moughataa, :commune, :village, :contracts)
                         .order(:last_name, :first_name)
    render json: @employees.map { |e| employee_json(e) }
  end

  def show
    render json: employee_json(@employee, full: true)
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
      render json: employee_json(@employee), status: :created
    else
      render json: { errors: @employee.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @employee.update(employee_params)
      render json: employee_json(@employee)
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
    @employee = Employee.includes(:employee_type, :wilaya, :moughataa, :commune, :village, :contracts).find(params[:id])
  end

  def employee_params
    params.require(:employee).permit(:nni, :first_name, :last_name, :birth_date, :phone,
                                     :employee_type_id, :wilaya_id, :moughataa_id, :commune_id, :village_id, :active)
  end

  def employee_json(e, full: false)
    active_contract = e.contracts.find { |c| c.active }
    data = {
      id: e.id,
      nni: e.nni,
      first_name: e.first_name,
      last_name: e.last_name,
      full_name: e.full_name,
      birth_date: e.birth_date,
      phone: e.phone,
      active: e.active,
      employee_type: e.employee_type ? { id: e.employee_type.id, name: e.employee_type.name } : nil,
      wilaya: e.wilaya ? { id: e.wilaya.id, name: e.wilaya.name } : nil,
      moughataa: e.moughataa ? { id: e.moughataa.id, name: e.moughataa.name } : nil,
      commune: e.commune ? { id: e.commune.id, name: e.commune.name } : nil,
      village: e.village ? { id: e.village.id, name: e.village.name } : nil,
      active_contract: active_contract ? contract_json(active_contract) : nil
    }
    data[:contracts] = e.contracts.map { |c| contract_json(c) } if full
    data
  end

  def contract_json(c)
    { id: c.id, contract_type: c.contract_type, amount: c.amount.to_f,
      start_date: c.start_date, duration_months: c.duration_months, active: c.active }
  end
end
