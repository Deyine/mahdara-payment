class ApplicationController < ActionController::API
  include Authenticable
  before_action :require_car_access
end
