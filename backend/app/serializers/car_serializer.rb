class CarSerializer
  def initialize(car)
    @car = car
  end

  def as_json
    {
      id: @car.id,
      vin: @car.vin,
      year: @car.year,
      color: @car.color,
      mileage: @car.mileage,
      purchase_date: @car.purchase_date,
      purchase_price: @car.purchase_price,
      clearance_cost: @car.clearance_cost,
      towing_cost: @car.towing_cost,
      seller_id: @car.seller_id,
      car_model_id: @car.car_model_id,
      tenant_id: @car.tenant_id,
      created_at: @car.created_at,
      updated_at: @car.updated_at,
      deleted_at: @car.deleted_at,
      deleted: @car.deleted?,

      # Sale fields
      status: @car.status,
      sale_price: @car.sale_price&.to_f,
      sale_date: @car.sale_date,

      # Calculated fields
      total_expenses: @car.total_expenses,
      total_cost: @car.total_cost,

      # Sale calculations
      total_paid: @car.total_paid,
      remaining_balance: @car.remaining_balance,
      fully_paid: @car.fully_paid?,
      payment_percentage: @car.payment_percentage,
      profit: @car.profit,

      # Associations
      car_model: @car.car_model,
      seller: @car.seller,
      expenses: @car.expenses,
      payments: payments_data,

      # Photos and invoices
      salvage_photos: salvage_photos_data,
      after_repair_photos: after_repair_photos_data,
      invoices: invoices_data
    }
  end

  private

  def salvage_photos_data
    @car.salvage_photos.map do |photo|
      {
        id: photo.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(photo, only_path: true),
        filename: photo.filename.to_s,
        size: photo.byte_size,
        content_type: photo.content_type
      }
    end
  end

  def after_repair_photos_data
    @car.after_repair_photos.map do |photo|
      {
        id: photo.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(photo, only_path: true),
        filename: photo.filename.to_s,
        size: photo.byte_size,
        content_type: photo.content_type
      }
    end
  end

  def invoices_data
    @car.invoices.map do |invoice|
      {
        id: invoice.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(invoice, only_path: true),
        filename: invoice.filename.to_s,
        size: invoice.byte_size,
        content_type: invoice.content_type
      }
    end
  end

  def payments_data
    @car.payments.map do |payment|
      PaymentSerializer.new(payment).as_json
    end
  end
end
