require "test_helper"

class ThermostatsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get thermostats_index_url
    assert_response :success
  end

  test "should get create" do
    get thermostats_create_url
    assert_response :success
  end

  test "should get update" do
    get thermostats_update_url
    assert_response :success
  end

  test "should get destroy" do
    get thermostats_destroy_url
    assert_response :success
  end
end
