class Vote < ApplicationRecord
  belongs_to :floorplan

  # Use integer field `value` with -1,0,1 semantics without enum to avoid name clash
  validates :visitor_uuid, presence: true
  validates :x, :y, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :value, inclusion: { in: [-1, 0, 1] }

  scope :recent, -> { where('created_at >= ?', 24.hours.ago) }

  # Weight with exponential decay; half-life in minutes
  def decayed_weight(half_life_minutes: 30)
    age_minutes = (Time.current - created_at) / 60.0
    decay_factor = 0.5 ** (age_minutes / half_life_minutes)
    value * decay_factor
  end
end
