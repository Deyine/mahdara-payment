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
              .order(sale_date: :desc, created_at: :desc)

      # Filter to only cars with profit (calculated method, not DB column)
      cars = all_cars.select { |car| car.profit.present? }

      # Calculate totals
      total_profit = cars.sum { |car| car.profit.to_f }
      total_user_profit = cars.sum { |car| car.user_profit_amount.to_f }
      total_company_profit = cars.sum { |car| car.company_net_profit.to_f }

      # Build car data
      cars_data = cars.map do |car|
        {
          id: car.id,
          ref: car.ref,
          vin: car.vin,
          model_name: car.car_model&.full_name,
          status: car.status,
          profit: car.profit,
          profit_share_percentage: car.profit_share_percentage&.to_f,
          user_profit_amount: car.user_profit_amount,
          company_net_profit: car.company_net_profit,
          sale_date: car.sale_date,
          purchase_date: car.purchase_date
        }
      end

      {
        user: {
          id: manager.id,
          name: manager.name,
          username: manager.username
        },
        total_profit: total_profit.round(2),
        total_user_profit: total_user_profit.round(2),
        total_company_profit: total_company_profit.round(2),
        cars: cars_data
      }
    end

    # Filter out managers with no profit share cars (only for admin view)
    profits_data = profits_data.select { |p| p[:cars].any? } unless current_user.manager?

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
    params.require(:user).permit(:name, :username, :password, :role)
  end

  def user_json(user)
    {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  end
end
