class Api::CommunesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy, :import]
  before_action :set_commune, only: [:show, :update, :destroy]

  def index
    scope = Commune.includes(moughataa: :wilaya).order(:name)
    scope = scope.where(moughataa_id: params[:moughataa_id]) if params[:moughataa_id].present?
    render json: CommuneSerializer.many(scope)
  end

  def show
    render json: CommuneSerializer.one(@commune)
  end

  def create
    @commune = Commune.new(commune_params)
    if @commune.save
      render json: CommuneSerializer.one(@commune), status: :created
    else
      render json: { errors: @commune.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @commune.update(commune_params)
      render json: CommuneSerializer.one(@commune)
    else
      render json: { errors: @commune.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @commune.destroy
    render json: { message: 'Commune supprimée' }
  rescue ActiveRecord::DeleteRestrictionError
    render json: { error: 'Impossible de supprimer une commune ayant des villages' }, status: :unprocessable_entity
  end

  def import
    file = params[:file]
    return render json: { error: 'Fichier requis' }, status: :bad_request unless file

    content = file.read.force_encoding('UTF-8')
    sep = content.lines.first.to_s.count(';') > content.lines.first.to_s.count(',') ? ';' : ','
    imported = 0; skipped = 0; errors = []

    require 'csv'
    CSV.parse(content, headers: true, col_sep: sep) do |row|
      name = row['name']&.strip
      moughataa_name = row['moughataa']&.strip
      next if name.blank?

      moughataa = Moughataa.find_by(name: moughataa_name)
      unless moughataa
        errors << "#{name}: moughataa '#{moughataa_name}' introuvable"
        next
      end

      c = Commune.find_or_initialize_by(name: name, moughataa_id: moughataa.id)
      if c.new_record?
        c.save ? imported += 1 : errors << "#{name}: #{c.errors.full_messages.join(', ')}"
      else
        skipped += 1
      end
    end

    render json: { imported: imported, skipped: skipped, errors: errors }
  end

  private

  def set_commune
    @commune = Commune.includes(moughataa: :wilaya).find(params[:id])
  end

  def commune_params
    params.require(:commune).permit(:name, :moughataa_id)
  end
end
