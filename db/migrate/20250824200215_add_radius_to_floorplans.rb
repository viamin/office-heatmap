class AddRadiusToFloorplans < ActiveRecord::Migration[8.0]
  def change
    add_column :floorplans, :radius, :integer, default: 50
  end
end
