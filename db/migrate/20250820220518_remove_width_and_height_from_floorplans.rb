class RemoveWidthAndHeightFromFloorplans < ActiveRecord::Migration[8.0]
  def change
    remove_column :floorplans, :width, :integer
    remove_column :floorplans, :height, :integer
  end
end
