require "zip"
require "tmpdir"

class ContractBatchExportJob < ApplicationJob
  queue_as :default

  def perform(batch_export_id)
    # Without this, rubyzip omits the UTF-8 filename flag and Arabic entry
    # names (employee names) come out as mojibake when extracted — most
    # visibly on Windows.
    Zip.unicode_names = true

    batch_export = BatchExport.find(batch_export_id)
    batch_export.update!(status: "processing")

    contracts = Contract.left_joins(employee: :mahdara)
                         .where(recruitment_batch: batch_export.recruitment_batch)
                         .includes(employee: [:employee_type, :wilaya, :moughataa, :commune, :village, :mahdara])
                         .order("employees.last_name", "employees.first_name")
    contracts = contracts.where(employees: { wilaya_id: batch_export.wilaya_id }) if batch_export.wilaya_id
    contracts = contracts.where(mahdaras: { niveau: batch_export.niveau }) if batch_export.niveau

    Dir.mktmpdir("batch-export-") do |tmpdir|
      zip_name = [batch_export.recruitment_batch, batch_export.wilaya&.name, niveau_label(batch_export.niveau)]
                   .compact.join(" - ")
      zip_path = File.join(tmpdir, "#{sanitize(zip_name)}.zip")
      used_names = Hash.new(0)

      Zip::File.open(zip_path, Zip::File::CREATE) do |zip|
        contracts.find_each do |contract|
          pdf = ContractDocumentService.generate(contract, format: :pdf)
          entry_name = unique_entry_name(contract, used_names)
          zip.get_output_stream(entry_name) { |out| out.write(pdf) }
        rescue StandardError => e
          Rails.logger.error("ContractBatchExportJob: skipped contract #{contract.id}: #{e.class}: #{e.message}")
        end
      end

      batch_export.zip_file.attach(
        io: File.open(zip_path),
        filename: File.basename(zip_path),
        content_type: "application/zip"
      )
    end

    batch_export.update!(status: "done")
  rescue StandardError => e
    batch_export&.update(status: "failed", error: "#{e.class}: #{e.message}")
    raise
  end

  private

  NIVEAU_LABELS = {
    "1" => "المستوى الأول",
    "2" => "المستوى الثاني",
    "3" => "المستوى الثالث"
  }.freeze

  def niveau_label(niveau)
    NIVEAU_LABELS[niveau]
  end

  def unique_entry_name(contract, used_names)
    base = sanitize("#{contract.employee.full_name} - #{contract.employee.nni}")
    used_names[base] += 1
    suffix = used_names[base] > 1 ? "-#{used_names[base]}" : ""
    "#{base}#{suffix}.pdf"
  end

  def sanitize(str)
    str.to_s.gsub(%r{[/\\:*?"<>|]}, "-").strip
  end
end
