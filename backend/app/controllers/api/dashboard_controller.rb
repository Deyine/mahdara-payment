class Api::DashboardController < ApplicationController
  before_action :authenticate_user!

  def statistics
    render json: {
      employees: {
        total: Employee.count,
        active: Employee.active.count
      },
      payment_batches: {
        total: PaymentBatch.count,
        draft: PaymentBatch.where(status: 'draft').count,
        confirmed: PaymentBatch.where(status: 'confirmed').count
      },
      employee_types: EmployeeType.count
    }
  end
end
