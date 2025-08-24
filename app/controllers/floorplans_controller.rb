class FloorplansController < ApplicationController
  before_action :authenticate_admin!, only: %i[ upload create edit update ]

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

  def edit
    @floorplan = Floorplan.first!
  end

  def update
    @floorplan = Floorplan.first!
    if @floorplan.update(floorplan_params)
      render json: { success: true, radius: @floorplan.radius }
    else
      render json: { errors: @floorplan.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def floorplan_params
    params.require(:floorplan).permit(:name, :image, :radius)
  end
end
