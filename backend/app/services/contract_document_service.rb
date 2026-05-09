require 'tmpdir'

class ContractDocumentService
  TEMPLATES = {
    'CDD' => Rails.root.join('lib', 'templates', 'contract_cdd.docx'),
    'CDI' => Rails.root.join('lib', 'templates', 'contract_cdi.docx')
  }.freeze

  SOFFICE_BIN = ENV['SOFFICE_BIN'] || 'soffice'

  def self.generate(contract, format: :pdf)
    docx = render_docx(contract)
    return docx if format == :docx
    convert_to_pdf(docx)
  end

  def self.render_docx(contract)
    template_path = TEMPLATES[contract.contract_type]
    raise "Template not found for #{contract.contract_type}: #{template_path}" unless File.exist?(template_path)

    employee = contract.employee
    template = Sablon.template(template_path.to_s)
    context = {
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
    }
    template.render_to_string(context)
  end

  def self.convert_to_pdf(docx_bytes)
    Dir.mktmpdir('contract-pdf-') do |tmpdir|
      docx_path = File.join(tmpdir, 'input.docx')
      File.binwrite(docx_path, docx_bytes)
      profile_uri = "file://#{tmpdir}/user_profile"
      cmd = [SOFFICE_BIN,
             "-env:UserInstallation=#{profile_uri}",
             '--headless', '--convert-to', 'pdf',
             '--outdir', tmpdir, docx_path]
      pid = Process.spawn(*cmd, out: File::NULL, err: File::NULL)
      Process.wait(pid)
      raise "soffice failed (exit #{$?.exitstatus})" unless $?.success?
      pdf_path = File.join(tmpdir, 'input.pdf')
      raise 'PDF not generated' unless File.exist?(pdf_path)
      File.binread(pdf_path)
    end
  end
end
