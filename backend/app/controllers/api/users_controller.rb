class Api::UsersController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :show, :managers, :profits]
  before_action :set_user, only: [:show, :update, :destroy]

  # GET /api/users - List users in the current tenant
  def index
    @users = tenant_scope(User).order(:name)
    render json: @users.map { |user| user_json(user) }
  end

  # GET /api/users/managers - List only managers in the current tenant
  def managers
    @managers = tenant_scope(User).managers.order(:name)
    render json: @managers.map { |user| user_json(user) }
  end

  # GET /api/users/profits - Get profit share data for managers
  def profits
    # Ensure user is authenticated
    return render json: { error: 'Unauthorized' }, status: :unauthorized unless current_user

    # If user is a manager, show only their own profit data
    # If user is admin/super_admin, show all managers' profit data
    if current_user.manager?
      managers_with_profits = [current_user]
    else
      # Get all managers in the tenant
      managers_with_profits = tenant_scope(User).managers.order(:name)
    end

    profits_data = managers_with_profits.map do |manager|
      # Get all cars where this manager has profit share
      all_cars = tenant_scope(Car)
              .includes(:car_model)
              .where(profit_share_user_id: manager.id)

      # Filter to only cars with profit OR sold cars (to show unpaid sold cars)
      cars = all_cars.select { |car| car.profit.present? || car.status == 'sold' }

      # Sort by ref (handle nil refs)
      cars = cars.sort_by { |car| car.ref || '' }

      # Calculate totals (only from fully paid cars)
      paid_cars = cars.select { |car| car.fully_paid? && car.profit.present? }
      total_profit = paid_cars.sum { |car| car.profit.to_f }
      total_user_profit = paid_cars.sum { |car| car.user_profit_amount.to_f }
      total_company_profit = paid_cars.sum { |car| car.company_net_profit.to_f }

      # Build car data
      cars_data = cars.map do |car|
        {
          id: car.id,
          ref: car.ref,
          vin: car.vin,
          model_name: car.car_model ? "#{car.car_model.name} #{car.year}" : nil,
          status: car.status,
          fully_paid: car.fully_paid?,
          profit: car.profit,
          profit_share_percentage: car.profit_share_percentage&.to_f,
          user_profit_amount: car.user_profit_amount,
          company_net_profit: car.company_net_profit,
          sale_date: car.sale_date,
          purchase_date: car.purchase_date
        }
      end

      # Get all rental transactions where this manager has profit share
      rental_transactions = tenant_scope(RentalTransaction)
                             .includes(car: :car_model)
                             .where(profit_share_user_id: manager.id)
                             .order(rental_date: :desc)

      # Calculate rental totals
      total_rental_user_profit = rental_transactions.sum { |rental| rental.user_profit_amount }
      total_rental_company_profit = rental_transactions.sum { |rental| rental.company_net_profit }
      total_rental_amount = rental_transactions.sum { |rental| rental.amount.to_f }

      # Build rental data
      rentals_data = rental_transactions.map do |rental|
        {
          id: rental.id,
          car_id: rental.car_id,
          car_ref: rental.car&.ref,
          car_vin: rental.car&.vin,
          car_model_name: rental.car&.car_model ? "#{rental.car.car_model.name} #{rental.car.year}" : nil,
          locataire: rental.locataire,
          rental_date: rental.rental_date,
          days: rental.days,
          daily_rate: rental.daily_rate.to_f,
          profit_per_day: rental.profit_per_day.to_f,
          amount: rental.amount.to_f,
          user_profit_amount: rental.user_profit_amount,
          company_net_profit: rental.company_net_profit,
          notes: rental.notes
        }
      end

      # Get all cashouts for this manager
      cashouts = tenant_scope(Cashout)
                  .where(user_id: manager.id)
                  .order(cashout_date: :desc)

      # Calculate total cashouts
      total_cashouts = cashouts.sum { |cashout| cashout.amount.to_f }

      # Build cashout data
      cashouts_data = cashouts.map do |cashout|
        {
          id: cashout.id,
          amount: cashout.amount.to_f,
          cashout_date: cashout.cashout_date,
          notes: cashout.notes,
          created_at: cashout.created_at
        }
      end

      # Get all debts for this manager (where user_id matches)
      debts = tenant_scope(Debt)
               .where(user_id: manager.id)
               .order(debt_date: :desc)

      # Calculate debt totals
      total_owed_to_company = debts.where(direction: 'we_lent').sum { |debt| debt.amount.to_f }
      total_company_owes = debts.where(direction: 'we_borrowed').sum { |debt| debt.amount.to_f }
      net_debt = total_owed_to_company - total_company_owes

      # Build debts data
      debts_data = debts.map do |debt|
        {
          id: debt.id,
          debtor_name: debt.debtor_name,
          direction: debt.direction,
          amount: debt.amount.to_f,
          debt_date: debt.debt_date,
          notes: debt.notes,
          created_at: debt.created_at
        }
      end

      # Calculate total manager profit (from car sales + rentals)
      total_manager_profit = total_user_profit + total_rental_user_profit

      # Calculate available balance (total profit - total cashouts - net debt)
      # net_debt is positive if they owe us, negative if we owe them
      available_balance = total_manager_profit - total_cashouts - net_debt

      {
        user: {
          id: manager.id,
          name: manager.name,
          username: manager.username,
          active: manager.active
        },
        total_profit: total_profit.round(2),
        total_user_profit: total_user_profit.round(2),
        total_company_profit: total_company_profit.round(2),
        total_rental_user_profit: total_rental_user_profit.round(2),
        total_rental_company_profit: total_rental_company_profit.round(2),
        total_rental_amount: total_rental_amount.round(2),
        total_manager_profit: total_manager_profit.round(2),
        total_cashouts: total_cashouts.round(2),
        total_owed_to_company: total_owed_to_company.round(2),
        total_company_owes: total_company_owes.round(2),
        net_debt: net_debt.round(2),
        available_balance: available_balance.round(2),
        cars: cars_data,
        rentals: rentals_data,
        cashouts: cashouts_data,
        debts: debts_data
      }
    end

    # Filter out managers with no profit share cars or rentals (only for admin view)
    profits_data = profits_data.select { |p| p[:cars].any? || p[:rentals].any? } unless current_user.manager?

    render json: { profits: profits_data }
  end

  # GET /api/users/:id
  def show
    render json: user_json(@user)
  end

  # POST /api/users
  def create
    @user = User.new(user_params)
    @user.tenant_id = current_user.tenant_id

    # Only super_admin can create admin or super_admin users
    if %w[admin super_admin].include?(user_params[:role]) && !current_user.super_admin?
      return render json: { errors: ['Seul un super admin peut créer des utilisateurs admin'] }, status: :forbidden
    end

    if @user.save
      render json: user_json(@user), status: :created
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PUT /api/users/:id
  def update
    # Prevent modifying own role
    if @user.id == current_user.id && user_params[:role].present? && user_params[:role] != @user.role
      return render json: { errors: ['Vous ne pouvez pas modifier votre propre rôle'] }, status: :forbidden
    end

    # Only super_admin can change role to admin or super_admin
    if %w[admin super_admin].include?(user_params[:role]) && !current_user.super_admin?
      return render json: { errors: ['Seul un super admin peut attribuer le rôle admin'] }, status: :forbidden
    end

    # Filter out password if empty
    params_to_update = user_params.to_h
    params_to_update.delete(:password) if params_to_update[:password].blank?

    if @user.update(params_to_update)
      render json: user_json(@user)
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/users/:id
  def destroy
    # Prevent deleting self
    if @user.id == current_user.id
      return render json: { error: 'Vous ne pouvez pas supprimer votre propre compte' }, status: :forbidden
    end

    # Prevent deleting super_admin unless you are super_admin
    if @user.super_admin? && !current_user.super_admin?
      return render json: { error: 'Seul un super admin peut supprimer un super admin' }, status: :forbidden
    end

    @user.destroy
    render json: { message: 'Utilisateur supprimé avec succès' }
  end

  private

  def set_user
    @user = tenant_scope(User).find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :username, :password, :role, :active)
  end

  def user_json(user)
    {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  end
end
