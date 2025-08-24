class ThermostatSettingsController < ApplicationController
  before_action :authenticate_admin!

  def create
    @thermostat = Thermostat.find(params[:thermostat_id])
    @setting = @thermostat.thermostat_settings.build(
      temperature: params[:temperature],
      admin: current_admin
    )

    if @setting.save
      render json: {
        id: @setting.id,
        temperature: @setting.temperature,
        created_at: @setting.created_at,
        admin_email: @setting.admin.email
      }, status: :created
    else
      render json: { errors: @setting.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
