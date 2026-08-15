class ApplicationController < ActionController::API
  include Authenticable
  include PaperTrail::Rails::Controller

  before_action :set_paper_trail_whodunnit

  private

  def info_for_paper_trail
    { ip_address: request.remote_ip, user_agent: request.user_agent }
  end
end
