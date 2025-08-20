class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Ensure visitor UUID cookie is set for all users
  before_action :ensure_visitor_uuid

  private

  def ensure_visitor_uuid
    cookies.permanent[:visitor_uuid] ||= SecureRandom.uuid
  end
end
