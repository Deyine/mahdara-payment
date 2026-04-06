module Api
  class AuthController < ApplicationController
    skip_before_action :authorize_request, only: [:login]

    def login
      user = User.includes(:assigned_role).find_by(username: params[:username])

      if user&.authenticate(params[:password])
        unless user.active
          return render json: { error: 'Account is inactive. Please contact an administrator.' }, status: :forbidden
        end

        token = JsonWebToken.encode(user_id: user.id)
        render json: { token: token, user: UserSerializer.one(user) }, status: :ok
      else
        render json: { error: 'Invalid credentials' }, status: :unauthorized
      end
    end
  end
end
