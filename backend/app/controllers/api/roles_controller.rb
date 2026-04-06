module Api
  class RolesController < ApplicationController
    before_action :authenticate_user!
    before_action :require_super_admin
    before_action :set_role, only: [:show, :update, :destroy]

    def index
      @roles = Role.left_joins(:users).group('roles.id').select('roles.*, COUNT(users.id) AS users_count').order(:name)
      render json: {
        roles: RoleSerializer.many(@roles),
        available_permissions: Permissions::BY_ENTITY
      }
    end

    def show
      render json: RoleSerializer.one(@role)
    end

    def create
      @role = Role.new(role_params)
      if @role.save
        render json: RoleSerializer.one(@role), status: :created
      else
        render json: { errors: @role.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @role.update(role_params)
        render json: RoleSerializer.one(@role)
      else
        render json: { errors: @role.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      if @role.users.any?
        return render json: { error: 'لا يمكن حذف دور مرتبط بمستخدمين' }, status: :unprocessable_entity
      end
      @role.destroy
      render json: { message: 'تم حذف الدور' }
    end

    private

    def set_role
      @role = Role.find(params[:id])
    end

    def role_params
      params.require(:role).permit(:name, :description, permissions: [])
    end
  end
end
