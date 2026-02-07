class Api::CatalogController < ActionController::API
  # No authentication required - public catalog access

  # GET /api/public/catalog
  def index
    cars = Car.catalog
              .includes(:car_model, :tenant, salvage_photos_attachments: :blob, after_repair_photos_attachments: :blob)
              .order(updated_at: :desc)

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i.clamp(1, 50)
    total = cars.count

    cars = cars.offset((page - 1) * per_page).limit(per_page)

    render json: {
      cars: cars.map { |car| CatalogCarSerializer.new(car).as_json },
      meta: {
        current_page: page,
        per_page: per_page,
        total_count: total,
        total_pages: (total.to_f / per_page).ceil
      }
    }
  end

  # GET /api/public/catalog/:id
  def show
    car = Car.catalog
             .includes(:car_model, :tenant, salvage_photos_attachments: :blob, after_repair_photos_attachments: :blob)
             .find(params[:id])

    render json: CatalogCarSerializer.new(car).as_json
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Véhicule non trouvé' }, status: :not_found
  end
end
