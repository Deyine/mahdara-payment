class RentalTransactionSerializer
  def initialize(rental_transaction)
    @rental = rental_transaction
  end

  def as_json
    {
      id: @rental.id,
      car_id: @rental.car_id,
      locataire: @rental.locataire,
      rental_date: @rental.rental_date,
      days: @rental.days,
      daily_rate: @rental.daily_rate.to_f,
      amount: @rental.amount.to_f,
      notes: @rental.notes,
      created_at: @rental.created_at,
      updated_at: @rental.updated_at,
      # Profit share fields
      profit_share_user_id: @rental.profit_share_user_id,
      profit_per_day: @rental.profit_per_day.to_f,
      has_profit_share: @rental.has_profit_share?,
      user_profit_amount: @rental.user_profit_amount,
      company_net_profit: @rental.company_net_profit,
      profit_share_user: profit_share_user_details,
      # Include car details if loaded
      car: car_details
    }
  end

  private

  def profit_share_user_details
    return nil unless @rental.profit_share_user

    {
      id: @rental.profit_share_user.id,
      name: @rental.profit_share_user.name,
      username: @rental.profit_share_user.username
    }
  end

  def car_details
    return nil unless @rental.car

    {
      id: @rental.car.id,
      vin: @rental.car.vin,
      car_model: @rental.car.car_model ? {
        id: @rental.car.car_model.id,
        name: @rental.car.car_model.name
      } : nil
    }
  end
end
