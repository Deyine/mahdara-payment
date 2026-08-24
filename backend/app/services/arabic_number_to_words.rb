class ArabicNumberToWords
  ONES_MASCULINE = %w[ واحد اثنان ثلاثة أربعة خمسة ستة سبعة ثمانية تسعة ].freeze
  ONES_FEMININE  = %w[ واحدة اثنتان ثلاث أربع خمس ست سبع ثمان تسع ].freeze

  TEENS_MASCULINE = %w[ أحد\ عشر اثنا\ عشر ثلاثة\ عشر أربعة\ عشر خمسة\ عشر ستة\ عشر سبعة\ عشر ثمانية\ عشر تسعة\ عشر ].freeze
  TEENS_FEMININE  = %w[ إحدى\ عشرة اثنتا\ عشرة ثلاث\ عشرة أربع\ عشرة خمس\ عشرة ست\ عشرة سبع\ عشرة ثمان\ عشرة تسع\ عشرة ].freeze

  TENS = %w[ عشرة عشرون ثلاثون أربعون خمسون ستون سبعون ثمانون تسعون ].freeze

  HUNDREDS = %w[ مائة مئتان ثلاثمائة أربعمائة خمسمائة ستمائة سبعمائة ثمانمائة تسعمائة ].freeze

  SCALES = [
    { singular: 'ألف', dual: 'ألفين', plural: 'آلاف' },
    { singular: 'مليون', dual: 'مليونين', plural: 'ملايين' },
    { singular: 'مليار', dual: 'ملياريين', plural: 'مليارات' }
  ].freeze

  CURRENCY = 'أوقية'.freeze

  # Spells out an integer amount of ouguiya in Arabic words, e.g.
  # ArabicNumberToWords.spell(15500) => "خمسة عشر ألفاً وخمسمائة أوقية"
  def self.spell(amount)
    new(amount).spell
  end

  def initialize(amount)
    @amount = amount.to_i
  end

  def spell
    return "صفر #{CURRENCY}" if @amount.zero?

    groups = split_into_groups(@amount)
    parts = []

    # groups[0] = billions, groups[1] = millions, groups[2] = thousands, groups[3] = units
    3.downto(1) do |scale_index|
      group_value = groups[3 - scale_index]
      next if group_value.zero?

      parts << group_with_scale(group_value, SCALES[scale_index - 1])
    end

    units_value = groups[3]
    parts << group_to_words(units_value, feminine: true) if units_value.positive?

    "#{parts.join(' و')} #{CURRENCY}"
  end

  private

  def split_into_groups(number)
    billions = number / 1_000_000_000
    millions = (number / 1_000_000) % 1000
    thousands = (number / 1_000) % 1000
    units = number % 1000
    [billions, millions, thousands, units]
  end

  def group_with_scale(value, scale)
    case value
    when 1
      scale[:singular]
    when 2
      scale[:dual]
    when 3..10
      "#{group_to_words(value, feminine: false)} #{scale[:plural]}"
    else
      "#{group_to_words(value, feminine: false)} #{scale[:singular]}"
    end
  end

  # feminine: true  -> agreement with the feminine currency noun (أوقية), uses the
  #                     "masculine-form" number words per Arabic gender-polarity rules.
  # feminine: false -> agreement with a masculine scale noun (ألف/مليون/مليار).
  def group_to_words(number, feminine:)
    return '' if number.zero?

    ones = feminine ? ONES_FEMININE : ONES_MASCULINE
    teens = feminine ? TEENS_FEMININE : TEENS_MASCULINE

    hundreds_digit = number / 100
    remainder = number % 100

    parts = []
    parts << HUNDREDS[hundreds_digit - 1] if hundreds_digit.positive?

    if remainder.positive?
      if remainder < 10
        parts << ones[remainder - 1]
      elsif remainder == 10
        parts << TENS[0]
      elsif remainder < 20
        parts << teens[remainder - 10 - 1]
      else
        tens_digit = remainder / 10
        ones_digit = remainder % 10
        sub = []
        sub << ones[ones_digit - 1] if ones_digit.positive?
        sub << TENS[tens_digit - 1]
        parts << sub.join(' و')
      end
    end

    parts.join(' و')
  end
end
