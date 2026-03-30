class Api::MoughataaController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy, :import]
  before_action :set_moughataa, only: [:show, :update, :destroy]

  def index
    scope = Moughataa.includes(:wilaya).order(:name)
    scope = scope.where(wilaya_id: params[:wilaya_id]) if params[:wilaya_id].present?
    render json: MoughataaSerializer.many(scope)
  end

  def show
    render json: MoughataaSerializer.one(@moughataa)
  end

  def create
    @moughataa = Moughataa.new(moughataa_params)
    if @moughataa.save
      render json: MoughataaSerializer.one(@moughataa), status: :created
    else
      render json: { errors: @moughataa.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @moughataa.update(moughataa_params)
      render json: MoughataaSerializer.one(@moughataa)
    else
      render json: { errors: @moughataa.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @moughataa.destroy
    render json: { message: 'Moughataa supprimée' }
  rescue ActiveRecord::DeleteRestrictionError
    render json: { error: 'Impossible de supprimer une moughataa ayant des communes' }, status: :unprocessable_entity
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
      wilaya_name = row['wilaya']&.strip
      next if name.blank?

      wilaya = Wilaya.find_by(name: wilaya_name)
      unless wilaya
        errors << "#{name}: wilaya '#{wilaya_name}' introuvable"
        next
      end

      m = Moughataa.find_or_initialize_by(name: name, wilaya_id: wilaya.id)
      if m.new_record?
        m.save ? imported += 1 : errors << "#{name}: #{m.errors.full_messages.join(', ')}"
      else
        skipped += 1
      end
    end

    render json: { imported: imported, skipped: skipped, errors: errors }
  end

  private

  def set_moughataa
    @moughataa = Moughataa.includes(:wilaya).find(params[:id])
  end

  def moughataa_params
    params.require(:moughataa).permit(:name, :wilaya_id)
  end
end
