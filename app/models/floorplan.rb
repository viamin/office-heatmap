class Floorplan < ApplicationRecord
  has_one_attached :image

  has_many :votes, dependent: :destroy
  has_many :thermostats, dependent: :destroy

  validates :name, presence: true
  validates :radius, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 200 }
end
