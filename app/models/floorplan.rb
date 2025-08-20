class Floorplan < ApplicationRecord
  has_one_attached :image

  has_many :votes, dependent: :destroy

  validates :name, presence: true
end
