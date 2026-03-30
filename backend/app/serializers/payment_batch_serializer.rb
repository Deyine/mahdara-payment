class PaymentBatchSerializer
  def self.one(b, full: false)
    total = b.payment_batch_employees.sum { |pbe| pbe.amount.to_f * pbe.months_count }
    data = {
      id: b.id,
      payment_date: b.payment_date,
      status: b.status,
      notes: b.notes,
      total: total,
      employees_count: b.payment_batch_employees.size,
      created_by: b.created_by ? { id: b.created_by.id, name: b.created_by.name } : nil,
      created_at: b.created_at
    }
    if full
      data[:employees] = b.payment_batch_employees.map do |pbe|
        {
          id: pbe.id,
          employee_id: pbe.employee_id,
          employee_name: pbe.employee&.full_name,
          months_count: pbe.months_count,
          amount: pbe.amount.to_f
        }
      end
    end
    data
  end

  def self.many(records, **opts)
    records.map { |b| one(b, **opts) }
  end
end
