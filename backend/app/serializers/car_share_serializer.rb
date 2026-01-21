class CarShareSerializer
  def initialize(car_share)
    @car_share = car_share
  end

  def as_json
    {
      id: @car_share.id,
      token: @car_share.token,
      car_id: @car_share.car_id,
      car_display_name: car_display_name,
      show_costs: @car_share.show_costs,
      show_expenses: @car_share.show_expenses,
      expires_at: @car_share.expires_at,
      expired: @car_share.expired?,
      view_count: @car_share.view_count,
      share_url: "/share/#{@car_share.token}",
      created_at: @car_share.created_at,
      created_by: {
        id: @car_share.created_by.id,
        name: @car_share.created_by.name
      }
    }
  end

  private

  def car_display_name
    car = @car_share.car
    car_name = "#{car.car_model.name} #{car.year}"
    car.ref.present? ? "##{car.ref} #{car_name}" : car_name
  end
end
