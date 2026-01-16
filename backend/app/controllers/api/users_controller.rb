class Api::UsersController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :show, :managers]
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
