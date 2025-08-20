module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :visitor_uuid

    def connect
      self.visitor_uuid = cookies.encrypted[:visitor_uuid] || cookies[:visitor_uuid]
    end
  end
end
