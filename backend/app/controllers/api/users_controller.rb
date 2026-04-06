class Api::UsersController < ApplicationController
  before_action :authenticate_user!
  before_action -> { require_permission('users:read')   }, only: [:index, :show]
  before_action -> { require_permission('users:create') }, only: [:create]
  before_action -> { require_permission('users:update') }, only: [:update]
  before_action -> { require_permission('users:delete') }, only: [:destroy]
  before_action :set_user, only: [:show, :update, :destroy]

  def index
    @users = User.includes(:assigned_role).order(:name)
    render json: UserSerializer.many(@users)
  end

  def show
    render json: UserSerializer.one(@user)
  end

  def create
    @user = User.new(user_params)

    # Only super_admin can create super_admin users
    if user_params[:role] == 'super_admin' && !current_user.super_admin?
      return render json: { errors: ['Seul un super admin peut créer des super admins'] }, status: :forbidden
    end

    if @user.save
      render json: UserSerializer.one(@user), status: :created
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @user.id == current_user.id && user_params[:role].present? && user_params[:role] != @user.role
      return render json: { errors: ['Vous ne pouvez pas modifier votre propre rôle'] }, status: :forbidden
    end

    # Only super_admin can assign the super_admin role
    if user_params[:role] == 'super_admin' && !current_user.super_admin?
      return render json: { errors: ['Seul un super admin peut attribuer le rôle super admin'] }, status: :forbidden
    end

    params_to_update = user_params.to_h
    params_to_update.delete(:password) if params_to_update[:password].blank?

    if @user.update(params_to_update)
      render json: UserSerializer.one(@user.reload)
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    return render json: { error: 'Vous ne pouvez pas supprimer votre propre compte' }, status: :forbidden if @user.id == current_user.id
    return render json: { error: 'Seul un super admin peut supprimer un super admin' }, status: :forbidden if @user.super_admin? && !current_user.super_admin?

    @user.destroy
    render json: { message: 'Utilisateur supprimé avec succès' }
  end

  private

  def set_user
    @user = User.includes(:assigned_role).find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :username, :password, :role, :role_id, :active)
  end
end
