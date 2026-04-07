class Api::EmployeesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { require_permission('employees:read')   }, only: [:index, :show, :lookup_nni]
  before_action -> { require_permission('employees:create') }, only: [:create]
  before_action -> { require_permission('employees:update') }, only: [:update]
  before_action -> { require_permission('employees:delete') }, only: [:destroy]
  before_action -> { require_permission('employees:export') }, only: [:export]
  before_action :set_employee, only: [:show, :update, :destroy]

  SORT_COLUMNS = {
    'nni'           => 'employees.nni',
    'name'          => 'employees.last_name',
    'employee_type' => 'employee_types.name',
    'wilaya'        => 'wilayas.name'
  }.freeze

  def index
    scope = Employee.all

    if params[:search].present?
      term = "%#{params[:search].downcase}%"
      scope = scope.where(
        "lower(employees.nni) LIKE :t OR lower(employees.first_name) LIKE :t OR lower(employees.last_name) LIKE :t",
        t: term
      )
    end
    scope = scope.where(employee_type_id: params[:employee_type_id]) if params[:employee_type_id].present?
    scope = scope.where(wilaya_id: params[:wilaya_id]) if params[:wilaya_id].present?

    sort_col = SORT_COLUMNS.fetch(params[:sort_by], 'employees.last_name')
    sort_dir = params[:sort_dir] == 'desc' ? 'DESC' : 'ASC'
    scope = scope.left_joins(:employee_type) if params[:sort_by] == 'employee_type'
    scope = scope.left_joins(:wilaya)        if params[:sort_by] == 'wilaya'
    scope = scope.order(Arel.sql("#{sort_col} #{sort_dir}"))

    total = scope.unscope(:order).count

    employees = if params[:per_page] == 'all'
      scope.preload(:employee_type, :wilaya, :moughataa, :commune, :village, :bank, :contracts,
                    mahdara: [:wilaya, :moughataa, :commune, :village, mahl_ilmi_attachment: :blob])
    else
      per_page = 20
      page     = [params[:page].to_i, 1].max
      scope
        .offset((page - 1) * per_page)
        .limit(per_page)
        .preload(:employee_type, :wilaya, :moughataa, :commune, :village, :bank, :contracts,
                 mahdara: [:wilaya, :moughataa, :commune, :village, mahl_ilmi_attachment: :blob])
    end

    render json: {
      employees: EmployeeSerializer.many(employees),
      meta: { total: total, page: page || 1, per_page: per_page || total, total_pages: per_page ? (total.to_f / per_page).ceil : 1 }
    }
  end

  def show
    render json: EmployeeSerializer.one(@employee, full: true)
  end

  def export
    scope = Employee.includes(:employee_type, :contracts, :wilaya)
                    .order(:last_name, :first_name)

    if params[:search].present?
      term = "%#{params[:search].downcase}%"
      scope = scope.where(
        "lower(employees.nni) LIKE :t OR lower(employees.first_name) LIKE :t OR lower(employees.last_name) LIKE :t",
        t: term
      )
    end
    scope = scope.where(employee_type_id: params[:employee_type_id]) if params[:employee_type_id].present?
    scope = scope.where(wilaya_id: params[:wilaya_id]) if params[:wilaya_id].present?

    package = Axlsx::Package.new
    wb = package.workbook
    styles = wb.styles

    header_style = styles.add_style(
      bg_color: '1E5A8F', fg_color: 'FFFFFF', b: true,
      alignment: { horizontal: :center, wrap_text: true },
      font_name: 'Arial'
    )
    center_style = styles.add_style(alignment: { horizontal: :center }, font_name: 'Arial')
    number_style = styles.add_style(
      format_code: '#,##0', alignment: { horizontal: :center }, font_name: 'Arial'
    )

    wb.add_worksheet(name: 'الموظفون') do |sheet|
      sheet.sheet_view.right_to_left = true

      sheet.add_row(
        ['الرقم الوطني', 'الإسم', 'المبلغ', 'النوع', 'نوع العقد'],
        style: header_style
      )
      sheet.column_widths 16, 35, 14, 20, 12

      scope.each do |emp|
        active_contract = emp.contracts.find(&:active)
        sheet.add_row([
          emp.nni,
          emp.full_name,
          active_contract ? active_contract.amount.to_f.round : nil,
          emp.employee_type&.name,
          active_contract&.contract_type
        ], style: [center_style, nil, number_style, center_style, center_style])
      end
    end

    filename = "employes-#{Date.today}.xlsx"
    send_data package.to_stream.read,
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              disposition: "attachment; filename=\"#{filename}\""
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
      attach_photo_from_huwiyeti(@employee)
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
                                  photo_attachment: :blob,
                                  mahdara: [:wilaya, :moughataa, :commune, :village, mahl_ilmi_attachment: :blob]).find(params[:id])
  end

  def attach_photo_from_huwiyeti(employee)
    person = HuwiyetiService.new.get_person_by_nni(employee.nni)
    return if person[:photo].blank?
    employee.photo.attach(
      io: StringIO.new(Base64.decode64(person[:photo])),
      filename: "#{employee.nni}.jpg",
      content_type: 'image/jpeg'
    )
  rescue StandardError => e
    Rails.logger.warn "Could not attach photo for employee #{employee.nni}: #{e.message}"
  end

  def employee_params
    params.require(:employee).permit(:nni, :first_name, :last_name, :first_name_fr, :last_name_fr,
                                     :pere_prenom_ar, :pere_prenom_fr,
                                     :birth_date, :phone, :employee_type_id, :wilaya_id,
                                     :moughataa_id, :commune_id, :village_id, :active,
                                     :bank_id, :account_number)
  end

  def employee_update_params
    params.require(:employee).permit(:phone, :employee_type_id, :wilaya_id, :moughataa_id, :commune_id, :village_id, :active,
                                     :bank_id, :account_number)
  end
end
