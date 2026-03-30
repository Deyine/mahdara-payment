class Api::PaymentBatchesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :destroy]
  before_action :set_batch, only: [:show, :destroy]

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
end
