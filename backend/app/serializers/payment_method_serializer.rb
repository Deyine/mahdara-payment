class PaymentMethodSerializer
  def initialize(payment_method)
    @payment_method = payment_method
  end

  def as_json
    {
      id: @payment_method.id,
      name: @payment_method.name,
      active: @payment_method.active,
      tenant_id: @payment_method.tenant_id,
      created_at: @payment_method.created_at,
      updated_at: @payment_method.updated_at
    }
  end
end
