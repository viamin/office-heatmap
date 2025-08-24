require "test_helper"

class ThermostatSettingsControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get thermostat_settings_create_url
    assert_response :success
  end
end
