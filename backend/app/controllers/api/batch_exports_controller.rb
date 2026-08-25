class Api::BatchExportsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { require_permission('contracts:export') }
  before_action :set_batch_export, only: [:show, :download]

  def create
    recruitment_batch = params[:recruitment_batch].to_s.strip
    return render json: { error: 'الرجاء اختيار مسابقة' }, status: :bad_request if recruitment_batch.blank?

    scope = Contract.where(recruitment_batch: recruitment_batch)

    wilaya = nil
    if params[:wilaya_id].present?
      wilaya = Wilaya.find_by(id: params[:wilaya_id])
      return render json: { error: 'الولاية غير موجودة' }, status: :not_found unless wilaya
      scope = scope.joins(:employee).where(employees: { wilaya_id: wilaya.id })
    end

    niveau = params[:niveau].presence
    if niveau
      unless Mahdara::NIVEAUX.include?(niveau)
        return render json: { error: 'مستوى غير صالح' }, status: :bad_request
      end
      scope = scope.joins(employee: :mahdara).where(mahdaras: { niveau: niveau })
    end

    unless scope.exists?
      return render json: { error: 'لا توجد عقود مطابقة' }, status: :not_found
    end

    batch_export = BatchExport.create!(
      recruitment_batch: recruitment_batch,
      wilaya: wilaya,
      niveau: niveau,
      requested_by: current_user
    )
    ContractBatchExportJob.perform_later(batch_export.id)
    render json: batch_export_json(batch_export), status: :created
  end

  def show
    render json: batch_export_json(@batch_export)
  end

  def download
    return render json: { error: 'الملف غير جاهز بعد' }, status: :unprocessable_entity unless @batch_export.zip_file.attached?

    redirect_to rails_blob_path(@batch_export.zip_file, disposition: 'attachment')
  end

  private

  def set_batch_export
    @batch_export = BatchExport.find(params[:id])
  end

  def batch_export_json(b)
    {
      id: b.id,
      recruitment_batch: b.recruitment_batch,
      wilaya_id: b.wilaya_id,
      niveau: b.niveau,
      status: b.status,
      error: b.error,
      ready: b.status == 'done' && b.zip_file.attached?,
      created_at: b.created_at
    }
  end
end
