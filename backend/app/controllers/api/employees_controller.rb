class Api::EmployeesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy]
  before_action :set_employee, only: [:show, :update, :destroy]

  def index
    @employees = Employee.includes(:employee_type, :wilaya, :moughataa, :commune, :village, :bank, :contracts,
                                   mahdara: [:wilaya, :moughataa, :commune, :village])
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
    if @employee.update(employee_update_params)
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
    @employee = Employee.includes(:employee_type, :wilaya, :moughataa, :commune, :village, :bank, :contracts,
                                  mahdara: [:wilaya, :moughataa, :commune, :village]).find(params[:id])
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

  def employee_json(e, full: false)
    active_contract = e.contracts.find { |c| c.active }
    data = {
      id: e.id,
      nni: e.nni,
      first_name: e.first_name,
      last_name: e.last_name,
      full_name: e.full_name,
      first_name_fr: e.first_name_fr,
      last_name_fr: e.last_name_fr,
      full_name_fr: e.full_name_fr,
      birth_date: e.birth_date,
      phone: e.phone,
      active: e.active,
      employee_type: e.employee_type ? { id: e.employee_type.id, name: e.employee_type.name, is_mahdara: e.employee_type.is_mahdara } : nil,
      wilaya: e.wilaya ? { id: e.wilaya.id, name: e.wilaya.name } : nil,
      moughataa: e.moughataa ? { id: e.moughataa.id, name: e.moughataa.name } : nil,
      commune: e.commune ? { id: e.commune.id, name: e.commune.name } : nil,
      village: e.village ? { id: e.village.id, name: e.village.name } : nil,
      bank: e.bank ? { id: e.bank.id, name: e.bank.name } : nil,
      account_number: e.account_number,
      active_contract: active_contract ? contract_json(active_contract) : nil,
      mahdara: mahdara_json(e.mahdara)
    }
    data[:contracts] = e.contracts.map { |c| contract_json(c) } if full
    data
  end

  def mahdara_json(m)
    return nil unless m
    {
      id: m.id,
      nom: m.nom,
      numero_releve: m.numero_releve,
      mahdara_type: m.mahdara_type,
      wilaya: m.wilaya ? { id: m.wilaya.id, name: m.wilaya.name } : nil,
      moughataa: m.moughataa ? { id: m.moughataa.id, name: m.moughataa.name } : nil,
      commune: m.commune ? { id: m.commune.id, name: m.commune.name } : nil,
      village: m.village ? { id: m.village.id, name: m.village.name } : nil,
      nombre_etudiants: m.nombre_etudiants,
      mahl_ilmi_attached: m.mahl_ilmi.attached?,
      mahl_ilmi_filename: m.mahl_ilmi.attached? ? m.mahl_ilmi.filename.to_s : nil
    }
  end

  def contract_json(c)
    { id: c.id, contract_type: c.contract_type, amount: c.amount.to_f,
      start_date: c.start_date, duration_months: c.duration_months, active: c.active }
  end
end
