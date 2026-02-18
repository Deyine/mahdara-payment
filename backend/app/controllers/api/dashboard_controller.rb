class Api::DashboardController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!

  def statistics
    # Load all active (non-deleted) cars with associations to avoid N+1
    all_cars = tenant_scope(Car).includes(:expenses, :payments)

    # Current inventory: cars not yet sold (active + rental)
    current_cars = all_cars.where(status: %w[active rental]).to_a
    total_invested_current = current_cars.sum(&:total_cost).round(2)

    # Sold cars
    sold_cars = all_cars.where(status: 'sold').to_a

    # Total debt: remaining balance from sold cars not yet fully paid
    unpaid_sold = sold_cars.reject(&:fully_paid?)
    total_debt = unpaid_sold.sum(&:remaining_balance).round(2)

    # History: only fully paid sold cars
    fully_paid_sold = sold_cars.select(&:fully_paid?)
    history_total_invested = fully_paid_sold.sum(&:total_cost).round(2)
    history_total_sales    = fully_paid_sold.sum { |car| car.sale_price.to_f }.round(2)
    history_benefit        = fully_paid_sold.sum { |car| car.profit.to_f }.round(2)

    render json: {
      cars: {
        current: {
          total_invested: total_invested_current,
          total_debt: total_debt
        },
        history: {
          cars_sold_count: sold_cars.count,
          total_invested: history_total_invested,
          total_sales: history_total_sales,
          benefit: history_benefit
        }
      }
    }
  end
end
