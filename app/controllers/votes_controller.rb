class VotesController < ApplicationController

  def index
    floorplan = Floorplan.first!
    votes = floorplan.votes.recent
    render json: votes.as_json(only: %i[id x y value created_at])
  end

  def create
    Rails.logger.info "Vote create action called with params: #{params.inspect}"

    floorplan = Floorplan.first!
    visitor_uuid = ensure_visitor_uuid
    ip_address = request.remote_ip

    Rails.logger.info "Visitor UUID: #{visitor_uuid}, IP: #{ip_address}"

    # Rate limit: allow one vote per visitor every 10 minutes (disabled in development)
    unless Rails.env.development?
      last_vote = floorplan.votes.where(visitor_uuid:).order(created_at: :desc).first
      if last_vote && last_vote.created_at > 10.minutes.ago
        Rails.logger.info "Rate limit hit for visitor #{visitor_uuid}"
        return render json: { error: "Too many votes. Please wait a bit." }, status: :too_many_requests
      end
    end

    vote = floorplan.votes.new(vote_params.merge(visitor_uuid:, ip_address:))
    Rails.logger.info "Creating vote: #{vote.inspect}"

    if vote.save
      Rails.logger.info "Vote saved successfully, broadcasting to channel"
      VotesChannel.broadcast_to(floorplan, vote.as_json(only: %i[id x y value created_at]))
      render json: { ok: true }, status: :created
    else
      Rails.logger.error "Vote save failed: #{vote.errors.full_messages}"
      render json: { errors: vote.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def ensure_visitor_uuid
    cookies.permanent[:visitor_uuid] ||= SecureRandom.uuid
    cookies[:visitor_uuid]
  end

  def vote_params
    params.require(:vote).permit(:x, :y, :value)
  end
end
