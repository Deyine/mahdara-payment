class Api::PublicController < ActionController::API
  # No authentication required - public access

  # GET /api/public/cars/:token
  def show_car
    car_share = CarShare.active.find_by!(token: params[:token])
    car = car_share.car

    # Increment view count
    car_share.increment_view_count!

    render json: PublicCarSerializer.new(car, car_share).as_json
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Ce lien de partage n\'existe pas ou a expiré' }, status: :not_found
  end
end
