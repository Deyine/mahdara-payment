class FullEmployeesExportService
  MAHDARA_TYPE_LABELS = {
    'jamia' => 'محظرة جامعة', 'mutakhassisa' => 'محظرة متخصصة',
    'quraniya' => 'محظرة قرآنية', 'awwaliya' => 'محظرة أولية'
  }.freeze

  NIVEAU_LABELS = {
    '1' => 'المستوى الأول', '2' => 'المستوى الثاني', '3' => 'المستوى الثالث'
  }.freeze

  HEADERS = [
    'الرقم الوطني', 'الاسم الأول (ع)', 'اسم الأب (ع)', 'اللقب (ع)',
    'الاسم الأول (ف)', 'اسم الأب (ف)', 'اللقب (ف)',
    'تاريخ الميلاد', 'مكان الميلاد', 'الهاتف', 'الحالة', 'النوع',
    'الولاية', 'المقاطعة', 'البلدية', 'القرية',
    'البنك', 'رقم الحساب',
    'المحظرة', 'المستوى', 'نوع المحظرة', 'رقم الإفادة', 'عدد الطلاب',
    'ولاية المحظرة', 'مقاطعة المحظرة', 'بلدية المحظرة', 'قرية المحظرة',
    'المسابقة', 'مرجع العقد', 'نوع العقد', 'المبلغ', 'تاريخ البداية',
    'المدة (أشهر)', 'العقد نشط', 'تاريخ الإنشاء'
  ].freeze

  # Column indexes that must stay text so Excel keeps leading zeros.
  TEXT_COLUMNS = [0, 9, 17, 21].freeze

  def self.generate(recruitment_batch: nil, wilaya_id: nil, niveau: nil)
    new(recruitment_batch, wilaya_id, niveau).generate
  end

  def initialize(recruitment_batch, wilaya_id, niveau)
    @recruitment_batch = recruitment_batch.presence
    @wilaya_id = wilaya_id.presence
    @niveau = niveau.presence
  end

  def generate
    package = Axlsx::Package.new
    styles = package.workbook.styles
    header_style = styles.add_style(
      bg_color: '1E5A8F', fg_color: 'FFFFFF', b: true,
      alignment: { horizontal: :center, wrap_text: true }, font_name: 'Arial'
    )
    text_style = styles.add_style(alignment: { horizontal: :center }, font_name: 'Arial')
    date_style = styles.add_style(format_code: 'yyyy-mm-dd', alignment: { horizontal: :center }, font_name: 'Arial')
    number_style = styles.add_style(format_code: '#,##0', alignment: { horizontal: :center }, font_name: 'Arial')

    package.workbook.add_worksheet(name: 'الموظفون') do |sheet|
      sheet.sheet_view.right_to_left = true
      sheet.add_row(HEADERS, style: header_style)
      sheet.column_widths(*Array.new(HEADERS.size, 18))

      row_count = 0
      scope.find_each do |employee|
        values = row_for(employee)
        types = Array.new(values.size)
        TEXT_COLUMNS.each { |i| types[i] = :string }
        styles_row = values.each_with_index.map do |v, i|
          if v.is_a?(Date) || v.is_a?(Time) then date_style
          elsif i == 30 then number_style
          else text_style
          end
        end
        sheet.add_row(values, style: styles_row, types: types)
        row_count += 1
      end

      sheet.auto_filter = "A1:#{Axlsx.col_ref(HEADERS.size - 1)}#{row_count + 1}"
      sheet.sheet_view.pane do |pane|
        pane.top_left_cell = 'A2'
        pane.state = :frozen
        pane.y_split = 1
      end
    end

    package.to_stream.read
  end

  private

  def scope
    s = Employee.includes(
      :employee_type, :wilaya, :moughataa, :commune, :village, :bank, :contracts,
      mahdara: [:wilaya, :moughataa, :commune, :village]
    ).order(:last_name, :first_name)
    s = s.where(wilaya_id: @wilaya_id) if @wilaya_id
    s = s.where(id: Contract.where(recruitment_batch: @recruitment_batch).select(:employee_id)) if @recruitment_batch
    s = s.where(id: Mahdara.where(niveau: @niveau).select(:employee_id)) if @niveau
    s
  end

  # The contract of the selected competition when filtering by one, otherwise
  # the active contract (most recent), falling back to the most recent overall.
  def contract_for(employee)
    contracts = employee.contracts.sort_by(&:created_at).reverse
    (@recruitment_batch && contracts.find { |c| c.recruitment_batch == @recruitment_batch }) ||
      contracts.find(&:active) || contracts.first
  end

  def row_for(e)
    m = e.mahdara
    c = contract_for(e)
    [
      e.nni, e.first_name, e.pere_prenom_ar, e.last_name,
      e.first_name_fr, e.pere_prenom_fr, e.last_name_fr,
      e.birth_date, e.birth_place, e.phone, e.active ? 'نشط' : 'غير نشط', e.employee_type&.name,
      e.wilaya&.name, e.moughataa&.name, e.commune&.name, e.village&.name,
      e.bank&.name, e.account_number,
      m&.nom, NIVEAU_LABELS[m&.niveau], MAHDARA_TYPE_LABELS[m&.mahdara_type], m&.numero_releve, m&.nombre_etudiants,
      m&.wilaya&.name, m&.moughataa&.name, m&.commune&.name, m&.village&.name,
      c&.recruitment_batch, c&.reference, c&.contract_type, c ? c.amount.to_f.round : nil, c&.start_date,
      c&.duration_months, c ? (c.active ? 'نعم' : 'لا') : nil, e.created_at&.to_date
    ]
  end
end
