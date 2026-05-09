class Api::ContractsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { require_permission('contracts:create') }, only: [:create]
  before_action -> { require_permission('contracts:update') }, only: [:update]
  before_action -> { require_permission('contracts:delete') }, only: [:destroy]
  before_action -> { require_permission('contracts:download') }, only: [:download]
  before_action :set_contract, only: [:update, :destroy, :download]

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
    docx = ContractDocumentService.generate(@contract)
    filename = "contrat-#{@contract.contract_type.downcase}-#{@contract.reference}.docx"
    send_data docx,
              filename: filename,
              content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              disposition: 'attachment'
  rescue => e
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
