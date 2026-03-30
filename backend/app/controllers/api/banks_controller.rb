class Api::BanksController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy]
  before_action :set_bank, only: [:show, :update, :destroy]

  def index
    @banks = Bank.order(:name)
    render json: BankSerializer.many(@banks)
  end

  def show
    render json: BankSerializer.one(@bank)
  end

  def create
    @bank = Bank.new(bank_params)
    if @bank.save
      render json: BankSerializer.one(@bank), status: :created
    else
      render json: { errors: @bank.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @bank.update(bank_params)
      render json: BankSerializer.one(@bank)
    else
      render json: { errors: @bank.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @bank.employees.any?
      return render json: { error: 'لا يمكن حذف بنك مرتبط بموظفين' }, status: :unprocessable_entity
    end
    @bank.destroy
    render json: { message: 'تم حذف البنك' }
  end

  private

  def set_bank
    @bank = Bank.find(params[:id])
  end

  def bank_params
    params.require(:bank).permit(:name, :active)
  end
end
