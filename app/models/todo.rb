class Todo < ApplicationRecord
  validates :title, presence: true

  attribute :completed, default: false
end
