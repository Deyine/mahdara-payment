class EmployeeSerializer
  def self.one(e, full: false)
    active_contract = e.contracts.find { |c| c.active }
    data = {
      id: e.id,
      nni: e.nni,
      first_name: e.first_name,
      last_name: e.last_name,
      full_name: e.full_name,
      first_name_fr: e.first_name_fr,
      last_name_fr: e.last_name_fr,
      full_name_fr: e.full_name_fr,
      pere_prenom_ar: e.pere_prenom_ar,
      pere_prenom_fr: e.pere_prenom_fr,
      photo: e.photo,
      birth_date: e.birth_date,
      phone: e.phone,
      active: e.active,
      employee_type: e.employee_type ? EmployeeTypeSerializer.one(e.employee_type) : nil,
      wilaya: e.wilaya ? WilayaSerializer.one(e.wilaya) : nil,
      moughataa: e.moughataa ? { id: e.moughataa.id, name: e.moughataa.name } : nil,
      commune: e.commune ? { id: e.commune.id, name: e.commune.name } : nil,
      village: e.village ? { id: e.village.id, name: e.village.name } : nil,
      bank: e.bank ? BankSerializer.one(e.bank) : nil,
      account_number: e.account_number,
      active_contract: active_contract ? ContractSerializer.one(active_contract) : nil,
      mahdara: MahdaraSerializer.one(e.mahdara)
    }
    data[:contracts] = ContractSerializer.many(e.contracts) if full
    data
  end

  def self.many(records, **opts)
    records.map { |e| one(e, **opts) }
  end
end
