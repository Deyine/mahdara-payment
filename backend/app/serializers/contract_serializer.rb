class ContractSerializer
  def self.one(c)
    {
      id: c.id,
      contract_type: c.contract_type,
      amount: c.amount.to_f,
      start_date: c.start_date,
      duration_months: c.duration_months,
      active: c.active
    }
  end

  def self.many(records)
    records.map { |c| one(c) }
  end
end
