class CatalogCarSerializer
  def initialize(car)
    @car = car
  end

  def as_json
    {
      id: @car.id,
      display_name: display_name,
      year: @car.year,
      color: @car.color,
      mileage: @car.mileage,
      status: @car.status,
      price: price_value,
      car_model: { name: @car.car_model.name },
      tenant_name: @car.tenant.name,
      salvage_photos: photos_data(@car.salvage_photos),
      after_repair_photos: photos_data(@car.after_repair_photos)
    }
  end

  private

  def display_name
    "#{@car.car_model.name} #{@car.year}"
  end

  def price_value
    case @car.status
    when 'sold'
      @car.sale_price&.to_f
    else
      @car.listing_price&.to_f
    end
  end

  def photos_data(photos)
    photos.map do |photo|
      {
        id: photo.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(photo, only_path: false),
        filename: photo.filename.to_s
      }
    end
  end
end
