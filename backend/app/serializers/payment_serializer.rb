class PaymentSerializer
  def initialize(payment)
    @payment = payment
  end

  def as_json
    {
      id: @payment.id,
      car_id: @payment.car_id,
      amount: @payment.amount.to_f,
      payment_date: @payment.payment_date,
      payment_method_id: @payment.payment_method_id,
      payment_method: @payment.payment_method ? {
        id: @payment.payment_method.id,
        name: @payment.payment_method.name
      } : nil,
      notes: @payment.notes,
      created_at: @payment.created_at,
      updated_at: @payment.updated_at
    }
  end
end
