module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authorize_request, unless: :preflight_request?
  end

  private

  def preflight_request?
    request.method == 'OPTIONS'
  end

  def authorize_request
    header = request.headers['Authorization']
    token = header.split(' ').last if header

    begin
      @decoded = JsonWebToken.decode(token)
      @current_user = User.find(@decoded[:user_id]) if @decoded
    rescue ActiveRecord::RecordNotFound, JWT::DecodeError
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  # Alias for compatibility
  alias_method :authenticate_user!, :authorize_request

  def require_admin
    unless current_user&.admin? || current_user&.super_admin?
      render json: { error: 'Admin access required' }, status: :forbidden
    end
  end

  def require_super_admin
    unless current_user&.super_admin?
      render json: { error: 'Super Admin access required' }, status: :forbidden
    end
  end

  def require_permission(feature)
    unless current_user&.has_permission?(feature)
      render json: { error: 'Access denied: missing permission' }, status: :forbidden
    end
  end

end
