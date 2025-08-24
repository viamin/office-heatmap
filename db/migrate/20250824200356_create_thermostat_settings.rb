class CreateThermostatSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :thermostat_settings do |t|
      t.references :thermostat, null: false, foreign_key: true
      t.decimal :temperature, precision: 4, scale: 1
      t.references :admin, null: false, foreign_key: true

      t.timestamps
    end
  end
end
