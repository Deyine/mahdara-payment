class Api::WilayasController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:create, :update, :destroy, :import]
  before_action :set_wilaya, only: [:show, :update, :destroy]

  def index
    render json: Wilaya.order(:name).map { |w| { id: w.id, name: w.name, code: w.code } }
  end

  def show
    render json: { id: @wilaya.id, name: @wilaya.name, code: @wilaya.code }
  end

  def create
    @wilaya = Wilaya.new(wilaya_params)
    if @wilaya.save
      render json: { id: @wilaya.id, name: @wilaya.name, code: @wilaya.code }, status: :created
    else
      render json: { errors: @wilaya.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @wilaya.update(wilaya_params)
      render json: { id: @wilaya.id, name: @wilaya.name, code: @wilaya.code }
    else
      render json: { errors: @wilaya.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @wilaya.destroy
    render json: { message: 'Wilaya supprimée' }
  rescue ActiveRecord::DeleteRestrictionError
    render json: { error: 'Impossible de supprimer une wilaya ayant des moughataa' }, status: :unprocessable_entity
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
      next if name.blank?
      w = Wilaya.find_or_initialize_by(name: name)
      if w.new_record?
        w.code = row['code']&.strip
        w.save ? imported += 1 : errors << "#{name}: #{w.errors.full_messages.join(', ')}"
      else
        skipped += 1
      end
    end

    render json: { imported: imported, skipped: skipped, errors: errors }
  end

  private

  def set_wilaya
    @wilaya = Wilaya.find(params[:id])
  end

  def wilaya_params
    params.require(:wilaya).permit(:name, :code)
  end
end
