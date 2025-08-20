class VotesChannel < ApplicationCable::Channel
  def subscribed
    floorplan = Floorplan.first
    stream_for floorplan if floorplan.present?
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
