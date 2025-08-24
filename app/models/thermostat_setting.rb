class ThermostatSetting < ApplicationRecord
  belongs_to :thermostat
  belongs_to :admin

  validates :temperature, presence: true, numericality: { greater_than: 32, less_than: 100 }
  
  scope :recent, -> { where("created_at >= ?", 24.hours.ago) }
end
