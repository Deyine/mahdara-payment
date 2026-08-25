class Api::ContractsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { require_permission('contracts:create') }, only: [:create]
  before_action -> { require_permission('contracts:update') }, only: [:update]
  before_action -> { require_permission('contracts:delete') }, only: [:destroy]
  before_action -> { require_permission('contracts:download') }, only: [:download]
  before_action -> { require_permission('contracts:export') }, only: [:recruitment_batches, :recruitment_batch_breakdown]
  before_action :set_contract, only: [:update, :destroy, :download]

  # Distinct recruitment batches (e.g. ministry competitions) with how many
  # contracts each has, for the batch-export picker.
  def recruitment_batches
    counts = Contract.where.not(recruitment_batch: nil)
                      .group(:recruitment_batch)
                      .count
    render json: counts.map { |batch, count| { recruitment_batch: batch, count: count } }
                        .sort_by { |b| -b[:count] }
  end

  # Per-wilaya, per-niveau contract counts within a batch, for the
  # wilaya -> niveau download picker.
  def recruitment_batch_breakdown
    recruitment_batch = params[:recruitment_batch].to_s.strip
    return render json: { error: 'الرجاء اختيار مسابقة' }, status: :bad_request if recruitment_batch.blank?

    rows = Contract.joins(employee: [:wilaya, :mahdara])
                    .where(recruitment_batch: recruitment_batch)
                    .group('wilayas.id', 'wilayas.name', 'mahdaras.niveau')
                    .count

    wilayas = {}
    rows.each do |(wilaya_id, wilaya_name, niveau), count|
      next if niveau.nil?

      wilayas[wilaya_id] ||= { wilaya_id: wilaya_id, wilaya_name: wilaya_name, niveaux: [] }
      wilayas[wilaya_id][:niveaux] << { niveau: niveau, count: count }
    end

    wilayas.each_value { |w| w[:niveaux].sort_by! { |n| n[:niveau] } }
    render json: wilayas.values.sort_by { |w| w[:wilaya_name] }
  end

  def create
    employee = Employee.find(params[:contract][:employee_id])
    @contract = employee.contracts.new(contract_params)
    if @contract.save
      render json: contract_json(@contract), status: :created
    else
      render json: { errors: @contract.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @contract.update(contract_params)
      render json: contract_json(@contract)
    else
      render json: { errors: @contract.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @contract.destroy
    render json: { message: 'Contrat supprimé' }
  end

  def download
    pdf = ContractDocumentService.generate(@contract)
    filename = "contrat-#{@contract.contract_type.downcase}-#{@contract.reference&.tr('/', '-')}.pdf"
    send_data pdf,
              filename: filename,
              content_type: 'application/pdf',
              disposition: 'attachment'
  rescue => e
    Rails.logger.error("Contract download failed: #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
    render json: { error: e.message }, status: :internal_server_error
  end

  private

  def set_contract
    @contract = Contract.find(params[:id])
  end

  def contract_params
    params.require(:contract).permit(:contract_type, :amount, :start_date, :duration_months, :active)
  end

  def contract_json(c)
    { id: c.id, reference: c.reference, employee_id: c.employee_id, contract_type: c.contract_type,
      amount: c.amount.to_f, start_date: c.start_date, duration_months: c.duration_months, active: c.active }
  end
end
