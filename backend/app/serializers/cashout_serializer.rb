class CashoutSerializer
  def initialize(cashout)
    @cashout = cashout
  end

  def as_json
    {
      id: @cashout.id,
      user_id: @cashout.user_id,
      amount: @cashout.amount.to_f,
      cashout_date: @cashout.cashout_date,
      notes: @cashout.notes,
      created_at: @cashout.created_at,
      updated_at: @cashout.updated_at,
      # Include user details if loaded
      user: user_details
    }
  end

  private

  def user_details
    return nil unless @cashout.user

    {
      id: @cashout.user.id,
      name: @cashout.user.name,
      username: @cashout.user.username
    }
  end
end
