module Api
  class AuthController < ApplicationController
    skip_before_action :authorize_request, only: [:login]

    def login
      user = User.find_by(username: params[:username])

      if user&.authenticate(params[:password])
        # Check if user is active
        unless user.active
          return render json: { error: 'Account is inactive. Please contact an administrator.' }, status: :forbidden
        end

        # Block operators from logging into the bestcar app
        if user.operator? && params[:app] == 'bestcar'
          return render json: { error: 'Invalid credentials' }, status: :unauthorized
        end

        token = JsonWebToken.encode(user_id: user.id)
        render json: {
          token: token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            tenant_id: user.tenant_id,
            permissions: user.permissions || {}
          }
        }, status: :ok
      else
        render json: { error: 'Invalid credentials' }, status: :unauthorized
      end
    end
  end
end
