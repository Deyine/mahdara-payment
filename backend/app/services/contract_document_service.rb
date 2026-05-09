class ContractDocumentService
  TEMPLATES = {
    'CDD' => Rails.root.join('lib', 'templates', 'contract_cdd.docx'),
    'CDI' => Rails.root.join('lib', 'templates', 'contract_cdi.docx')
  }.freeze

  def self.generate(contract)
    template_path = TEMPLATES[contract.contract_type]
    raise "Template not found for #{contract.contract_type}: #{template_path}" unless File.exist?(template_path)

    employee = contract.employee
    template = Sablon.template(template_path.to_s)
    context = Sablon.context(
      contract_number:  contract.reference.to_s,
      employee_name:    employee.full_name,
      birth_date:       employee.birth_date&.strftime('%d/%m/%Y') || '...',
      birth_place:      employee.birth_place.presence || '...',
      nni:              employee.nni,
      phone:            employee.phone.presence || '...',
      job_title:        employee.employee_type.name,
      amount:           ActionController::Base.helpers.number_with_delimiter(contract.amount.to_i, delimiter: ','),
      start_date:       contract.start_date.strftime('%d/%m/%Y'),
      signing_date:     Date.today.strftime('%d/%m/%Y'),
      employee_name_fr: employee.full_name_fr
    )
    template.render_to_string(context)
  end
end
