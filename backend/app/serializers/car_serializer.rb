class CarSerializer
  def initialize(car)
    @car = car
  end

  def as_json
    {
      id: @car.id,
      vin: @car.vin,
      ref: @car.ref,
      display_name: display_name,
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

      # Catalog fields
      published: @car.published,
      listing_price: @car.listing_price&.to_f,

      # Calculated fields
      total_expenses: @car.total_expenses,
      total_cost: @car.total_cost,

      # Sale calculations
      total_paid: @car.total_paid,
      remaining_balance: @car.remaining_balance,
      fully_paid: @car.fully_paid?,
      payment_percentage: @car.payment_percentage,
      profit: @car.profit,

      # Profit share
      profit_share_user_id: @car.profit_share_user_id,
      profit_share_percentage: @car.profit_share_percentage&.to_f,
      profit_share_user: profit_share_user_data,
      has_profit_share: @car.has_profit_share?,
      user_profit_amount: @car.user_profit_amount,
      company_net_profit: @car.company_net_profit,

      # Rental calculations
      rental_transactions: rental_transactions_data,
      total_rental_income: @car.total_rental_income,
      rental_break_even: @car.rental_break_even?,
      has_rental_history: @car.has_rental_history?,

      # Associations
      car_model: @car.car_model,
      seller: @car.seller,
      expenses: @car.expenses,
      payments: payments_data,
      tags: @car.tags,

      # Photos and invoices
      salvage_photos: salvage_photos_data,
      after_repair_photos: after_repair_photos_data,
      invoices: invoices_data
    }
  end

  private

  def display_name
    car_name = "#{@car.car_model.name} #{@car.year}"
    @car.ref.present? ? "##{@car.ref} #{car_name}" : car_name
  end

  def salvage_photos_data
    photos = @car.salvage_photos.map do |photo|
      {
        id: photo.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(photo, only_path: false),
        filename: photo.filename.to_s,
        size: photo.byte_size,
        content_type: photo.content_type
      }
    end
    order = @car.salvage_photos_order.presence
    return photos unless order
    order_index = order.each_with_index.to_h { |id, i| [id, i] }
    photos.sort_by { |p| order_index.fetch(p[:id], Float::INFINITY) }
  end

  def after_repair_photos_data
    photos = @car.after_repair_photos.map do |photo|
      {
        id: photo.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(photo, only_path: false),
        filename: photo.filename.to_s,
        size: photo.byte_size,
        content_type: photo.content_type
      }
    end
    order = @car.after_repair_photos_order.presence
    return photos unless order
    order_index = order.each_with_index.to_h { |id, i| [id, i] }
    photos.sort_by { |p| order_index.fetch(p[:id], Float::INFINITY) }
  end

  def invoices_data
    @car.invoices.map do |invoice|
      {
        id: invoice.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(invoice, only_path: false),
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

  def rental_transactions_data
    @car.rental_transactions.map do |rental|
      RentalTransactionSerializer.new(rental).as_json
    end
  end

  def profit_share_user_data
    return nil unless @car.profit_share_user
    {
      id: @car.profit_share_user.id,
      name: @car.profit_share_user.name,
      username: @car.profit_share_user.username
    }
  end
end
