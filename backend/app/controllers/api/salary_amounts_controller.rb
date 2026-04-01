class Api::SalaryAmountsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :destroy]

  def index
    render json: SalaryAmount.order(:amount).map { |sa| { id: sa.id, amount: sa.amount } }
  end

  def create
    @salary_amount = SalaryAmount.new(amount: params[:amount].to_i)
    if @salary_amount.save
      render json: { id: @salary_amount.id, amount: @salary_amount.amount }, status: :created
    else
      render json: { errors: @salary_amount.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @salary_amount = SalaryAmount.find(params[:id])
    @salary_amount.destroy
    render json: { message: 'تم الحذف' }
  end
end
