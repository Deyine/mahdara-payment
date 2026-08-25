require "roo"

module MahdaraLocationMatching
  # Ministry candidate lists come from different data-entry clerks per wilaya,
  # so moughataa/commune spelling is inconsistent (missing hamzas, ة/ه swaps,
  # kashida stretching, ق/ك confusion, dropped/added "ال" articles, stray
  # trailing digits). Policy: try to match the closest existing record; if
  # nothing is close enough, create a new one with the raw text as given.
  # Blank source cells are left blank — never guessed.

  def self.normalize(str)
    return nil if str.nil?
    s = str.to_s.strip
    return nil if s.empty?
    s = s.gsub("ـ", "") # tatweel/kashida
    s = s.gsub(/\s+/, " ")
    s = s.gsub(/[أإآ]/, "ا")
    s = s.tr("ةى", "هي")
    s = s.sub(/\A(?:ال|ل)(?=.{3,})/, "") # leading definite article (ال or dialectal ل)
    s = s.sub(/\s*\d+\z/, "") # trailing stray numbering ("...1", "... 2")
    s.strip
  end

  # Optimal-string-alignment distance: plain Levenshtein plus adjacent-
  # transposition as a single edit (so "تبمدغه" vs "تمبدغة" — swapped
  # neighbouring letters — costs 1, not 2, while two unrelated substitutions
  # elsewhere in the word still cost 2 and stay above threshold).
  def self.damerau_levenshtein(a, b)
    m, n = a.length, b.length
    return n if m == 0
    return m if n == 0

    d = Array.new(m + 1) { Array.new(n + 1, 0) }
    (0..m).each { |i| d[i][0] = i }
    (0..n).each { |j| d[0][j] = j }

    a.each_char.with_index(1) do |ca, i|
      b.each_char.with_index(1) do |cb, j|
        cost = ca == cb ? 0 : 1
        d[i][j] = [
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + cost
        ].min
        if i > 1 && j > 1 && ca == b[j - 2] && a[i - 2] == cb
          d[i][j] = [d[i][j], d[i - 2][j - 2] + 1].min
        end
      end
    end
    d[m][n]
  end

  # Returns the best-matching record from `scope` (by #name) for `raw_name`,
  # or nil if nothing is close enough (caller should create a new record).
  # A containment match ("حاسي" inside "حاسي أهل أحمد بشنه") only counts if
  # the shorter side is a substantial fraction of the longer one — otherwise
  # a short generic word (a well/hill/etc. prefix shared by many place names)
  # would wrongly latch onto any name containing it. A mismatch here would
  # misattribute someone's official record, so the edit-distance threshold
  # stays tight — favor creating an extra record over a wrong link.
  def self.candidate_pair_score(target, candidate)
    return :exact if target == candidate

    contains = candidate.include?(target) || target.include?(candidate)
    if contains
      shorter, longer = [target.length, candidate.length].minmax
      return nil if longer.zero? || (shorter.to_f / longer) < 0.5
      return -shorter
    end

    distance = damerau_levenshtein(target, candidate)
    threshold = target.length <= 6 ? 1 : [2, (target.length * 0.25).ceil].max
    distance <= threshold ? distance : nil
  end

  def self.best_match(raw_name, scope)
    target = normalize(raw_name)
    return nil if target.nil?

    best = nil
    best_score = nil
    scope.each do |record|
      candidate = normalize(record.name)
      next if candidate.nil?

      # compare against the full name, and — only for a substantial single-
      # word input — against the candidate's first word alone (covers
      # "آزكلم التياب" matching a bare "ازكيلم"). Short words like "حاسي"
      # ("well") are common generic prefixes shared by many different place
      # names, so they're excluded to avoid latching onto the wrong one.
      forms = [candidate]
      forms << candidate.split(" ").first if target.length >= 5 && !target.include?(" ")
      forms.uniq.each do |form|
        score = candidate_pair_score(target, form)
        next if score.nil?
        return record if score == :exact

        if best_score.nil? || score < best_score
          best = record
          best_score = score
        end
      end
    end
    best
  end

  # Finds the closest existing record under `scope`, or creates one with the
  # raw (untouched) name if nothing matches closely enough. Returns nil if
  # raw_name is blank — blanks are never guessed or created.
  def self.resolve(model, scope, raw_name, extra_attrs)
    return nil if raw_name.to_s.strip.empty?

    best_match(raw_name, scope) || model.create!(extra_attrs.merge(name: raw_name.to_s.strip))
  end
end

namespace :mahdara do
  desc "Import accepted competition candidates from a وزارة الشؤون الإسلامية candidate list (.xlsx) as employees, mahdaras and CDD contracts"
  task :import_candidates, [:xlsx_path] => :environment do |_, args|
    xlsx_path = args[:xlsx_path]
    abort "Usage: rails mahdara:import_candidates[path/to/file.xlsx]" if xlsx_path.blank?

    WILAYA_ALIAS = {
      "الترارزة"          => "اترارزة",
      "كيدي ماغا"         => "كيدي ماغه",
      "لبراكنة"           => "لبراكنه",
      "انواكشوط الشمالية" => "نواكشوط الشمالية",
      "انواكشوط الغربية"  => "نواكشوط الغربية",
      "انواكشوط الجنوبية" => "نواكشوط الجنوبية",
      "داخلت انواذيبو"    => "داخلت نواذيبو",
      "لعصابة"            => "العصابة"
    }.freeze

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

      candidate_no, wilaya_name, _no2, nni, full_name, mahdara_nom, moughataa_name,
        commune_name, village_name, phone, level, _score, _attendance, status = row
      next unless status.to_s.strip == "مقبول"

      candidate_no_str = candidate_no.to_s.strip
      nni_raw = nni.to_s.strip

      # An NNI is 10 digits; a shorter value is just missing its leading
      # zero(s) (safe to pad), but blank or over-long values have no
      # recoverable correct form — skip rather than guess.
      if nni_raw.empty? || nni_raw.length > 10
        skipped += 1
        puts "[SKIP] candidate ##{candidate_no_str} — #{full_name} (invalid NNI: #{nni_raw.inspect})"
        next
      end

      nni = nni_raw.rjust(10, "0")

      if Employee.exists?(nni: nni)
        skipped += 1
        puts "[SKIP] #{nni} — #{full_name} (already exists)"
        next
      end

      begin
        wilaya_raw = wilaya_name.to_s.strip
        wilaya = Wilaya.find_by!(name: WILAYA_ALIAS.fetch(wilaya_raw, wilaya_raw))

        moughataa = MahdaraLocationMatching.resolve(
          Moughataa, Moughataa.where(wilaya: wilaya), moughataa_name, { wilaya: wilaya }
        )
        commune = moughataa && MahdaraLocationMatching.resolve(
          Commune, Commune.where(moughataa: moughataa), commune_name, { moughataa: moughataa }
        )
        village = if commune && village_name.to_s.strip.present?
          Village.find_or_create_by!(commune: commune, name: village_name.to_s.strip)
        end

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
        puts "[OK] #{nni} — #{full_name} — #{level.to_s.strip} (#{amount} MRU) — #{moughataa&.name} / #{commune&.name}"
      rescue StandardError => e
        errors << "#{nni} — #{full_name}: #{e.message}"
        puts "[ERROR] #{nni} — #{full_name}: #{e.message}"
      end
    end

    puts "\nDone. Created: #{created}, Skipped (existing): #{skipped}, Errors: #{errors.size}"
    errors.each { |e| puts "  #{e}" }
  end
end
