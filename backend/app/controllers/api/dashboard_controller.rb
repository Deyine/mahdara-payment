class Api::DashboardController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!

  def statistics
    @cars = tenant_scope(Car)
    @expenses = tenant_scope(Expense)

    stats = {
      cars: {
        total: @cars.count,
        recent: @cars.recent.limit(5).as_json(include: :car_model, methods: [:total_cost])
      },
      expenses: {
        total: @expenses.count,
        total_amount: @expenses.sum(:amount).to_f,
        this_month: @expenses.where('expense_date >= ?', Date.current.beginning_of_month).sum(:amount).to_f,
        recent: @expenses.includes(:car, :expense_category).recent.limit(5).as_json(include: [:car, :expense_category])
      },
      summary: {
        total_cars_value: @cars.sum(:purchase_price).to_f,
        total_expenses: @expenses.sum(:amount).to_f,
        total_investment: @cars.sum(:purchase_price).to_f + @expenses.sum(:amount).to_f
      }
    }

    render json: stats
  end
end
