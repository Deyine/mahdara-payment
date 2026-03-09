class Api::UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :show]
  before_action :set_user, only: [:show, :update, :destroy]

  def index
    @users = User.order(:name)
    render json: @users.map { |u| user_json(u) }
  end

  def show
    render json: user_json(@user)
  end

  def create
    @user = User.new(user_params)

    if %w[admin super_admin].include?(user_params[:role]) && !current_user.super_admin?
      return render json: { errors: ['Seul un super admin peut créer des utilisateurs admin'] }, status: :forbidden
    end

    if @user.save
      render json: user_json(@user), status: :created
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @user.id == current_user.id && user_params[:role].present? && user_params[:role] != @user.role
      return render json: { errors: ['Vous ne pouvez pas modifier votre propre rôle'] }, status: :forbidden
    end

    if %w[admin super_admin].include?(user_params[:role]) && !current_user.super_admin?
      return render json: { errors: ['Seul un super admin peut attribuer le rôle admin'] }, status: :forbidden
    end

    params_to_update = user_params.to_h
    params_to_update.delete(:password) if params_to_update[:password].blank?

    if @user.update(params_to_update)
      render json: user_json(@user)
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
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :username, :password, :role, :active, permissions: {})
  end

  def user_json(user)
    {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active,
      permissions: user.permissions || {},
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  end
end
