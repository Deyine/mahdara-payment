class Api::PaymentBatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :destroy]
  before_action :set_batch, only: [:show, :destroy]

  def index
    @batches = PaymentBatch.includes(:created_by, payment_batch_employees: :employee)
                           .order(created_at: :desc)
    render json: @batches.map { |b| batch_json(b) }
  end

  def show
    render json: batch_json(@batch, full: true)
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

    render json: batch_json(@batch, full: true), status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  def destroy
    return render json: { error: 'Seul un lot en brouillon peut être supprimé' }, status: :forbidden unless @batch.draft?
    @batch.destroy
    render json: { message: 'Lot supprimé' }
  end

  private

  def set_batch
    @batch = PaymentBatch.includes(:created_by, payment_batch_employees: :employee).find(params[:id])
  end

  def batch_params
    params.require(:payment_batch).permit(:payment_date, :notes)
  end

  def batch_json(b, full: false)
    total = b.payment_batch_employees.sum { |pbe| pbe.amount.to_f * pbe.months_count }
    data = {
      id: b.id,
      payment_date: b.payment_date,
      status: b.status,
      notes: b.notes,
      total: total,
      employees_count: b.payment_batch_employees.size,
      created_by: b.created_by ? { id: b.created_by.id, name: b.created_by.name } : nil,
      created_at: b.created_at
    }
    if full
      data[:employees] = b.payment_batch_employees.map do |pbe|
        {
          id: pbe.id,
          employee_id: pbe.employee_id,
          employee_name: pbe.employee&.full_name,
          months_count: pbe.months_count,
          amount: pbe.amount.to_f
        }
      end
    end
    data
  end
end
