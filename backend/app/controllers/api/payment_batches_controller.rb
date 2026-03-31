class Api::PaymentBatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :destroy, :confirm]
  before_action :set_batch, only: [:show, :destroy, :confirm, :export]

  def index
    @batches = PaymentBatch.includes(:created_by, payment_batch_employees: :employee)
                           .order(created_at: :desc)
    render json: PaymentBatchSerializer.many(@batches)
  end

  def show
    render json: PaymentBatchSerializer.one(@batch, full: true)
  end

  def create
    @batch = PaymentBatch.new(batch_params)
    @batch.created_by_id = current_user.id
    @batch.status = 'draft'

    ActiveRecord::Base.transaction do
      @batch.save!
      (params[:employees] || []).each do |emp|
        @batch.payment_batch_employees.create!(
          employee_id: emp[:employee_id],
          months_count: emp[:months_count],
          amount: emp[:amount]
        )
      end
    end

    render json: PaymentBatchSerializer.one(@batch, full: true), status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  def confirm
    return render json: { error: 'La dفعة est déjà confirmée' }, status: :unprocessable_entity if @batch.confirmed?
    @batch.update!(status: 'confirmed')
    render json: PaymentBatchSerializer.one(@batch, full: true)
  end

  def export
    return render json: { error: 'Seuls les lots confirmés peuvent être exportés' }, status: :forbidden unless @batch.confirmed?

    package = Axlsx::Package.new
    wb = package.workbook
    styles = wb.styles

    header_style = styles.add_style(bg_color: 'E0E0E0', b: true, alignment: { horizontal: :center })
    number_style = styles.add_style(format_code: '#,##0', alignment: { horizontal: :center })
    center_style = styles.add_style(alignment: { horizontal: :center })

    wb.add_worksheet(name: 'Paiement') do |sheet|
      sheet.add_row(
        ['N°', 'NNI', 'NOM ET PRENOM', 'COMPTE', 'BANQUE', 'SALAIRE', 'IMF', 'NET/MOIS', 'NB MOIS', 'SALAIRE BRUT', 'IMF TOTAL', 'NET TOTAL'],
        style: header_style
      )

      sheet.column_widths 6, 14, 30, 20, 15, 14, 10, 14, 10, 14, 10, 14

      entries = @batch.payment_batch_employees
                      .includes(employee: [:employee_type, :bank])
                      .order('employees.last_name, employees.first_name')

      entries.each_with_index do |pbe, idx|
        emp    = pbe.employee
        amount = pbe.amount.to_f.round
        months = pbe.months_count

        imf        = emp.employee_type.apply_imf ? (amount * 0.025).round : 0
        net_month  = amount - imf
        gross      = amount * months
        total_imf  = imf * months
        total_net  = net_month * months

        full_name = [emp.first_name_fr.presence || emp.first_name,
                     emp.last_name_fr.presence  || emp.last_name].join(' ')

        sheet.add_row(
          [idx + 1, emp.nni, full_name, emp.account_number, emp.bank&.name,
           amount, imf, net_month, months, gross, total_imf, total_net],
          style: [center_style, center_style, nil, center_style, nil,
                  number_style, number_style, number_style, center_style,
                  number_style, number_style, number_style]
        )
      end
    end

    filename = "paiement-#{@batch.payment_date}.xlsx"
    send_data package.to_stream.read,
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              disposition: "attachment; filename=\"#{filename}\""
  end

  def destroy
    return render json: { error: 'Seul un lot en brouillon peut être supprimé' }, status: :forbidden unless @batch.draft?
    @batch.destroy
    render json: { message: 'Lot supprimé' }
  end

  private

  def set_batch
    @batch = PaymentBatch.includes(:created_by, payment_batch_employees: { employee: [:employee_type, :bank] }).find(params[:id])
  end

  def batch_params
    params.require(:payment_batch).permit(:payment_date, :notes)
  end
end
