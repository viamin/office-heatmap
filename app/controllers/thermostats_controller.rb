class ThermostatsController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_floorplan
  before_action :set_thermostat, only: [:update, :destroy]

  def index
    @thermostats = @floorplan.thermostats.includes(:thermostat_settings)
    
    respond_to do |format|
      format.json do
        thermostats_data = @thermostats.map do |thermostat|
          current_setting = thermostat.current_temperature_setting
          {
            id: thermostat.id,
            name: thermostat.name,
            x: thermostat.x,
            y: thermostat.y,
            current_temperature: current_setting&.temperature,
            last_updated: current_setting&.created_at
          }
        end
        render json: thermostats_data
      end
    end
  end

  def create
    @thermostat = @floorplan.thermostats.build(thermostat_params)
    
    if @thermostat.save
      render json: {
        id: @thermostat.id,
        name: @thermostat.name,
        x: @thermostat.x,
        y: @thermostat.y,
        current_temperature: nil,
        last_updated: nil
      }, status: :created
    else
      render json: { errors: @thermostat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @thermostat.update(thermostat_params)
      render json: {
        id: @thermostat.id,
        name: @thermostat.name,
        x: @thermostat.x,
        y: @thermostat.y
      }
    else
      render json: { errors: @thermostat.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @thermostat.destroy
    head :no_content
  end

  private

  def set_floorplan
    @floorplan = Floorplan.first!
  end

  def set_thermostat
    @thermostat = @floorplan.thermostats.find(params[:id])
  end

  def thermostat_params
    params.require(:thermostat).permit(:name, :x, :y)
  end
end
