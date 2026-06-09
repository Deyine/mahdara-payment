class Api::ReportsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { require_permission('reports:read') }

  YOUNGEST_LIMIT = 20

  # Integrity / review report across ALL employees.
  # Surfaces cases that warrant a manual review (neutral framing on purpose).
  def review
    render json: {
      youngest:              youngest_section,
      same_mahdara_name:     same_mahdara_name_section,
      same_mahdara_location: same_mahdara_location_section,
      same_father:           same_father_section,
      same_bank_account:     same_bank_account_section
    }
  end

  private

  # --- Indicator 1: the youngest employees (most recent birth dates) ---
  def youngest_section
    Employee.includes(:employee_type)
            .where.not(birth_date: nil)
            .order(birth_date: :desc)
            .limit(YOUNGEST_LIMIT)
            .map { |e| employee_brief(e).merge(birth_date: e.birth_date, age: age_for(e.birth_date)) }
  end

  # --- Indicator 2: mahdaras sharing the same name ---
  def same_mahdara_name_section
    mahdaras = mahdara_scope.select { |m| m.nom.present? }
    grouped = mahdaras.group_by { |m| normalize(m.nom) }
                      .select { |_, ms| ms.size > 1 }
    grouped.values.map do |ms|
      { label: ms.first.nom, count: ms.size, employees: ms.map { |m| mahdara_member(m) } }
    end
  end

  # --- Indicator 3: mahdaras sharing the same full location ---
  def same_mahdara_location_section
    mahdaras = mahdara_scope.where.not(wilaya_id: nil)
                            .where.not(moughataa_id: nil)
                            .where.not(commune_id: nil)
                            .where.not(village_id: nil)
    grouped = mahdaras.group_by { |m| [m.wilaya_id, m.moughataa_id, m.commune_id, m.village_id] }
                      .select { |_, ms| ms.size > 1 }
    grouped.values.map do |ms|
      { label: location_str(ms.first), count: ms.size, employees: ms.map { |m| mahdara_member(m) } }
    end
  end

  # --- Indicator 4: employees with the same father (patronyme + father first name) ---
  # No dedicated father-family-name column exists; the patronyme (last_name) is the
  # inherited lineage name, so we pair it with the father's first name (pere_prenom_ar).
  def same_father_section
    employees = Employee.includes(:employee_type)
                        .where.not(last_name: [nil, ''])
                        .where.not(pere_prenom_ar: [nil, ''])
    grouped = employees.group_by { |e| [normalize(e.last_name), normalize(e.pere_prenom_ar)] }
                       .select { |_, es| es.size > 1 }
    grouped.values.map do |es|
      { label: "#{es.first.pere_prenom_ar} #{es.first.last_name}".strip,
        count: es.size,
        employees: es.map { |e| employee_brief(e) } }
    end
  end

  # --- Indicator 5: employees sharing the same bank account ---
  def same_bank_account_section
    employees = Employee.includes(:employee_type, :bank).where.not(account_number: [nil, ''])
    grouped = employees.group_by { |e| [e.bank_id, e.account_number.to_s.strip] }
                       .select { |_, es| es.size > 1 }
    grouped.values.map do |es|
      { label: [es.first.bank&.name, es.first.account_number].compact.join(' - '),
        count: es.size,
        employees: es.map { |e| employee_brief(e).merge(bank: e.bank&.name, account_number: e.account_number) } }
    end
  end

  # --- helpers ---

  def mahdara_scope
    Mahdara.includes(:wilaya, :moughataa, :commune, :village, employee: :employee_type)
  end

  def employee_brief(e)
    {
      employee_id: e.id,
      full_name: e.full_name,
      nni: e.nni,
      employee_type: e.employee_type&.name
    }
  end

  def mahdara_member(m)
    employee_brief(m.employee).merge(mahdara_name: m.nom, location: location_str(m))
  end

  def location_str(m)
    [m.wilaya&.name, m.moughataa&.name, m.commune&.name, m.village&.name].compact.join(' / ')
  end

  def normalize(str)
    str.to_s.strip.downcase.gsub(/\s+/, ' ')
  end

  def age_for(birth_date)
    today = Date.today
    age = today.year - birth_date.year
    age -= 1 if today.month < birth_date.month ||
                (today.month == birth_date.month && today.day < birth_date.day)
    age
  end
end
