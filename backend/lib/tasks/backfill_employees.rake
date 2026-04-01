namespace :employees do
  desc "Backfill pere_prenom_ar, pere_prenom_fr and photo for existing employees via Huwiyeti API"
  task backfill_huwiyeti: :environment do
    employees = Employee.where(pere_prenom_ar: nil)
    total = employees.count
    puts "#{total} employees to backfill..."

    updated = 0
    failed  = 0

    employees.find_each do |employee|
      person = HuwiyetiService.new.get_person_by_nni(employee.nni)
      employee.update_columns(
        pere_prenom_ar: person[:pere_prenom_ar],
        pere_prenom_fr: person[:pere_prenom_fr],
        photo:          person[:photo]
      )
      updated += 1
      puts "[#{updated}/#{total}] ✓ #{employee.nni} — #{employee.full_name}"
    rescue StandardError => e
      failed += 1
      puts "[SKIP] #{employee.nni} — #{e.message}"
    end

    puts "\nDone. Updated: #{updated}, Skipped: #{failed}"
  end
end
