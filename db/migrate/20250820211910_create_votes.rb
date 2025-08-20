class CreateVotes < ActiveRecord::Migration[8.0]
  def change
    create_table :votes do |t|
      t.string :visitor_uuid
      t.string :ip_address
      t.integer :x
      t.integer :y
      t.integer :value
      t.integer :floorplan_id

      t.timestamps
    end
    add_index :votes, :floorplan_id
  end
end
