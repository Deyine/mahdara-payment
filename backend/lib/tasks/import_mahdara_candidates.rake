require "roo"

namespace :mahdara do
  desc "Import accepted competition candidates from a وزارة الشؤون الإسلامية candidate list (.xlsx) as employees, mahdaras and CDD contracts"
  task :import_candidates, [:xlsx_path] => :environment do |_, args|
    xlsx_path = args[:xlsx_path]
    abort "Usage: rails mahdara:import_candidates[path/to/file.xlsx]" if xlsx_path.blank?

    NIVEAU_CODES = {
      "المستوى الأول"  => "1",
      "المستوى الثاني" => "2",
      "المستوى الثالث" => "3"
    }.freeze

    NIVEAU_AMOUNTS = {
      "1" => 10_000,
      "2" => 5_000,
      "3" => 3_000
    }.freeze

    CONTRACT_START_DATE     = Date.new(2026, 8, 3)
    CONTRACT_DURATION_MONTHS = 5

    sheikh_type = EmployeeType.find_by!(name: "شيخ محظرة")

    sheet = Roo::Excelx.new(xlsx_path).sheet(0)
    header_row = (1..sheet.last_row).find { |i| sheet.cell(i, 1).to_s.strip == "#" }
    abort "Could not find the header row (column '#')" unless header_row

    created = 0
    skipped = 0
    errors  = []

    ((header_row + 1)..sheet.last_row).each do |i|
      row = sheet.row(i)
      next if row.compact.empty?

      _, wilaya_name, _candidate_no, nni, full_name, mahdara_nom, moughataa_name,
        commune_name, village_name, phone, level, _score, _attendance, status = row
      next unless status.to_s.strip == "مقبول"

      nni = nni.to_s.strip.rjust(10, "0")

      if Employee.exists?(nni: nni)
        skipped += 1
        puts "[SKIP] #{nni} — #{full_name} (already exists)"
        next
      end

      begin
        wilaya    = Wilaya.find_by!(name: wilaya_name.to_s.strip)
        moughataa = Moughataa.find_by!(wilaya: wilaya, name: moughataa_name.to_s.strip)
        commune   = Commune.find_by!(moughataa: moughataa, name: commune_name.to_s.strip)
        village   = Village.find_or_create_by!(commune: commune, name: village_name.to_s.strip)

        identity = HuwiyetiService.new.get_person_by_nni(nni)
        niveau   = NIVEAU_CODES.fetch(level.to_s.strip)
        amount   = NIVEAU_AMOUNTS.fetch(niveau)

        ActiveRecord::Base.transaction do
          employee = Employee.create!(
            nni:            nni,
            first_name:     identity[:first_name],
            last_name:      identity[:last_name],
            first_name_fr:  identity[:first_name_fr],
            last_name_fr:   identity[:last_name_fr],
            pere_prenom_ar: identity[:pere_prenom_ar],
            pere_prenom_fr: identity[:pere_prenom_fr],
            birth_date:     identity[:birth_date],
            birth_place:    identity[:birth_place],
            phone:          phone.to_s.strip,
            employee_type:  sheikh_type,
            wilaya:         wilaya,
            moughataa:      moughataa,
            commune:        commune,
            village:        village
          )

          if identity[:photo].present?
            employee.photo.attach(
              io: StringIO.new(Base64.decode64(identity[:photo])),
              filename: "#{nni}.jpg",
              content_type: "image/jpeg"
            )
          end

          Mahdara.create!(
            employee:  employee,
            nom:       mahdara_nom.to_s.strip,
            niveau:    niveau,
            wilaya:    wilaya,
            moughataa: moughataa,
            commune:   commune,
            village:   village
          )

          Contract.create!(
            employee:         employee,
            contract_type:    "CDD",
            amount:           amount,
            start_date:       CONTRACT_START_DATE,
            duration_months:  CONTRACT_DURATION_MONTHS
          )
        end

        created += 1
        puts "[OK] #{nni} — #{full_name} — #{level.to_s.strip} (#{amount} MRU)"
      rescue StandardError => e
        errors << "#{nni} — #{full_name}: #{e.message}"
        puts "[ERROR] #{nni} — #{full_name}: #{e.message}"
      end
    end

    puts "\nDone. Created: #{created}, Skipped (existing): #{skipped}, Errors: #{errors.size}"
    errors.each { |e| puts "  #{e}" }
  end
end
