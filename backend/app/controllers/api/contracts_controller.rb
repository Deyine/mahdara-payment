class Api::ContractsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin
  before_action :set_contract, only: [:update, :destroy]

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

  private

  def set_contract
    @contract = Contract.find(params[:id])
  end

  def contract_params
    params.require(:contract).permit(:contract_type, :amount, :start_date, :duration_months, :active)
  end

  def contract_json(c)
    { id: c.id, employee_id: c.employee_id, contract_type: c.contract_type,
      amount: c.amount.to_f, start_date: c.start_date, duration_months: c.duration_months, active: c.active }
  end
end
