class FloorplansController < ApplicationController
  before_action :authenticate_admin!, only: %i[ upload create ]

  def show
    @floorplan = Floorplan.first!
    @votes = @floorplan.votes.recent.order(created_at: :desc)
  end

  def upload
    @floorplan = Floorplan.first_or_initialize
  end

  def create
    @floorplan = Floorplan.first_or_initialize
    @floorplan.assign_attributes(floorplan_params)
    if @floorplan.save
      redirect_to floorplan_path, notice: "Floorplan updated"
    else
      render :upload, status: :unprocessable_entity
    end
  end

  private

  def floorplan_params
    params.require(:floorplan).permit(:name, :image)
  end
end
