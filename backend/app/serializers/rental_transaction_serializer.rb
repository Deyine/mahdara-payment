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
      # Include car details if loaded
      car: car_details
    }
  end

  private

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
