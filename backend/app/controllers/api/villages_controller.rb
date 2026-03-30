class Api::VillagesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy, :import]
  before_action :set_village, only: [:show, :update, :destroy]

  def index
    scope = Village.includes(commune: { moughataa: :wilaya }).order(:name)
    scope = scope.where(commune_id: params[:commune_id]) if params[:commune_id].present?
    render json: VillageSerializer.many(scope)
  end

  def show
    render json: VillageSerializer.one(@village)
  end

  def create
    @village = Village.new(village_params)
    if @village.save
      render json: VillageSerializer.one(@village), status: :created
    else
      render json: { errors: @village.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @village.update(village_params)
      render json: VillageSerializer.one(@village)
    else
      render json: { errors: @village.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @village.destroy
    render json: { message: 'Village supprimé' }
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
      commune_name = row['commune']&.strip
      next if name.blank?

      commune = Commune.find_by(name: commune_name)
      unless commune
        errors << "#{name}: commune '#{commune_name}' introuvable"
        next
      end

      v = Village.find_or_initialize_by(name: name, commune_id: commune.id)
      if v.new_record?
        v.save ? imported += 1 : errors << "#{name}: #{v.errors.full_messages.join(', ')}"
      else
        skipped += 1
      end
    end

    render json: { imported: imported, skipped: skipped, errors: errors }
  end

  private

  def set_village
    @village = Village.includes(commune: :moughataa).find(params[:id])
  end

  def village_params
    params.require(:village).permit(:name, :commune_id)
  end
end
