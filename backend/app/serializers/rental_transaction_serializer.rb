class RentalTransactionSerializer
  def initialize(rental_transaction)
    @rental = rental_transaction
  end

  def as_json
    {
      id: @rental.id,
      car_id: @rental.car_id,
      amount: @rental.amount.to_f,
      start_date: @rental.start_date,
      end_date: @rental.end_date,
      billing_frequency: @rental.billing_frequency,
      rate_per_period: @rental.rate_per_period&.to_f,
      renter_name: @rental.renter_name,
      renter_phone: @rental.renter_phone,
      renter_id_number: @rental.renter_id_number,
      notes: @rental.notes,
      status: @rental.status,
      duration_days: @rental.duration_days,
      created_at: @rental.created_at,
      updated_at: @rental.updated_at
    }
  end
end
