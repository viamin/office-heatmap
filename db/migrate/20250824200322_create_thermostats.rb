class CreateThermostats < ActiveRecord::Migration[8.0]
  def change
    create_table :thermostats do |t|
      t.references :floorplan, null: false, foreign_key: true
      t.string :name
      t.integer :x
      t.integer :y

      t.timestamps
    end
  end
end
