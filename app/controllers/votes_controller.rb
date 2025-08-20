class VotesController < ApplicationController
  protect_from_forgery with: :null_session, only: :create

  def index
    floorplan = Floorplan.first!
    votes = floorplan.votes.recent
    render json: votes.as_json(only: %i[id x y value created_at])
  end

  def create
    floorplan = Floorplan.first!
    visitor_uuid = ensure_visitor_uuid
    ip_address = request.remote_ip

    # Rate limit: allow one vote per visitor every 10 minutes
    last_vote = floorplan.votes.where(visitor_uuid:).order(created_at: :desc).first
    if last_vote && last_vote.created_at > 10.minutes.ago
      return render json: { error: "Too many votes. Please wait a bit." }, status: :too_many_requests
    end

    vote = floorplan.votes.new(vote_params.merge(visitor_uuid:, ip_address:))
    if vote.save
      VotesChannel.broadcast_to(floorplan, vote.as_json(only: %i[id x y value created_at]))
      render json: { ok: true }, status: :created
    else
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
