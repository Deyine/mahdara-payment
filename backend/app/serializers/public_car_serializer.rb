class PublicCarSerializer
  def initialize(car, car_share)
    @car = car
    @car_share = car_share
  end

  def as_json
    data = {
      # Always visible: Vehicle Information
      id: @car.id,
      vin: @car.vin,
      ref: @car.ref,
      display_name: display_name,
      year: @car.year,
      color: @car.color,
      mileage: @car.mileage,
      purchase_date: @car.purchase_date,
      car_model: { name: @car.car_model.name },
      seller: @car.seller ? { name: @car.seller.name } : nil,

      # Always visible: Photos
      salvage_photos: photos_data(@car.salvage_photos),
      after_repair_photos: photos_data(@car.after_repair_photos),

      # Meta
      share_settings: {
        show_costs: @car_share.show_costs,
        show_expenses: @car_share.show_expenses
      }
    }

    # Optional: Cost Details
    if @car_share.show_costs
      data[:costs] = {
        purchase_price: @car.purchase_price.to_f,
        clearance_cost: @car.clearance_cost.to_f,
        towing_cost: @car.towing_cost.to_f,
        total_expenses: @car.total_expenses,
        total_cost: @car.total_cost
      }
    end

    # Optional: Expenses List
    if @car_share.show_expenses
      data[:expenses] = expenses_data
    end

    data
  end

  private

  def display_name
    car_name = "#{@car.car_model.name} #{@car.year}"
    @car.ref.present? ? "##{@car.ref} #{car_name}" : car_name
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

  def expenses_data
    @car.expenses.order(expense_date: :desc).map do |expense|
      {
        id: expense.id,
        expense_date: expense.expense_date,
        amount: expense.amount.to_f,
        description: expense.description,
        category: expense.expense_category&.name
      }
    end
  end
end
