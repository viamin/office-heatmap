class Thermostat < ApplicationRecord
  belongs_to :floorplan
  has_many :thermostat_settings, dependent: :destroy

  validates :name, presence: true
  validates :x, :y, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def current_temperature_setting
    thermostat_settings.order(created_at: :desc).first
  end

  def temperature_at_time(target_time)
    thermostat_settings.where('created_at <= ?', target_time).order(created_at: :desc).first
  end
end
