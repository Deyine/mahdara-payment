class Api::MahdarasController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update]
  before_action :set_mahdara, only: [:update, :document]

  def create
    @mahdara = Mahdara.new(mahdara_params)
    if @mahdara.save
      render json: mahdara_json(@mahdara), status: :created
    else
      render json: { errors: @mahdara.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @mahdara.update(mahdara_params)
      render json: mahdara_json(@mahdara)
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
    @mahdara = Mahdara.includes(:wilaya, :moughataa, :commune, :village).find(params[:id])
  end

  def mahdara_params
    params.require(:mahdara).permit(:employee_id, :nom, :numero_releve, :mahdara_type,
                                    :wilaya_id, :moughataa_id, :commune_id, :village_id,
                                    :nombre_etudiants, :mahl_ilmi)
  end

  def mahdara_json(m)
    {
      id: m.id,
      employee_id: m.employee_id,
      nom: m.nom,
      numero_releve: m.numero_releve,
      mahdara_type: m.mahdara_type,
      wilaya: m.wilaya ? { id: m.wilaya.id, name: m.wilaya.name } : nil,
      moughataa: m.moughataa ? { id: m.moughataa.id, name: m.moughataa.name } : nil,
      commune: m.commune ? { id: m.commune.id, name: m.commune.name } : nil,
      village: m.village ? { id: m.village.id, name: m.village.name } : nil,
      nombre_etudiants: m.nombre_etudiants,
      mahl_ilmi_attached: m.mahl_ilmi.attached?,
      mahl_ilmi_filename: m.mahl_ilmi.attached? ? m.mahl_ilmi.filename.to_s : nil
    }
  end
end
