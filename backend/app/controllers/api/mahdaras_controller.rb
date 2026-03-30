class Api::MahdarasController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update]
  before_action :set_mahdara, only: [:update, :document]

  def create
    @mahdara = Mahdara.new(mahdara_params)
    if @mahdara.save
      render json: MahdaraSerializer.one(@mahdara), status: :created
    else
      render json: { errors: @mahdara.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @mahdara.update(mahdara_params)
      render json: MahdaraSerializer.one(@mahdara)
    else
      render json: { errors: @mahdara.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def document
    if @mahdara.mahl_ilmi.attached?
      send_data @mahdara.mahl_ilmi.download,
                filename: @mahdara.mahl_ilmi.filename.to_s,
                content_type: @mahdara.mahl_ilmi.content_type,
                disposition: 'attachment'
    else
      render json: { error: 'لا يوجد مستند مرفق' }, status: :not_found
    end
  end

  private

  def set_mahdara
    @mahdara = Mahdara.includes(:wilaya, :moughataa, :commune, :village, mahl_ilmi_attachment: :blob).find(params[:id])
  end

  def mahdara_params
    params.require(:mahdara).permit(:employee_id, :nom, :numero_releve, :mahdara_type,
                                    :wilaya_id, :moughataa_id, :commune_id, :village_id,
                                    :nombre_etudiants, :mahl_ilmi)
  end
end
