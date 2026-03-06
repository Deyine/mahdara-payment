class Api::DashboardController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!

  def statistics
    # Load all active (non-deleted) cars with associations to avoid N+1
    all_cars = tenant_scope(Car).includes(:expenses, :payments, :car_model)

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

    # Payment heatmap: last 6 months for unpaid sold cars
    months = (0..5).map { |i| Date.current.beginning_of_month - i.months }.reverse

    unpaid_cars_payments = unpaid_sold.map do |car|
      monthly_payments = months.map do |month|
        start_date = month.beginning_of_month
        end_date = month.end_of_month
        total = car.payments
                   .select { |p| p.payment_date >= start_date && p.payment_date <= end_date }
                   .sum { |p| p.amount.to_f }
        { month: month.strftime('%Y-%m'), total: total.round(2) }
      end

      {
        car_id: car.id,
        car_label: "#{car.car_model.name} #{car.year}",
        ref: car.ref,
        sale_price: car.sale_price.to_f,
        total_paid: car.total_paid,
        remaining: car.remaining_balance,
        monthly_payments: monthly_payments
      }
    end

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
      },
      unpaid_cars_payments: unpaid_cars_payments
    }
  end
end
