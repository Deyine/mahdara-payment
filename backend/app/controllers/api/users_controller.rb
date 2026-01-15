class Api::UsersController < ApplicationController
  include MultiTenantable

  before_action :authenticate_user!

  # GET /api/users - List users in the current tenant
  def index
    @users = tenant_scope(User).order(:name)
    render json: @users.map { |user|
      {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    }
  end
end
