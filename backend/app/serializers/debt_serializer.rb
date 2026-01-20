class DebtSerializer
  def initialize(debt)
    @debt = debt
  end

  def as_json
    {
      id: @debt.id,
      debtor_name: @debt.debtor_name,
      user_id: @debt.user_id,
      direction: @debt.direction,
      amount: @debt.amount.to_f,
      debt_date: @debt.debt_date,
      notes: @debt.notes,
      created_at: @debt.created_at,
      updated_at: @debt.updated_at,
      user: user_details
    }
  end

  private

  def user_details
    return nil unless @debt.user

    {
      id: @debt.user.id,
      name: @debt.user.name,
      username: @debt.user.username
    }
  end
end
