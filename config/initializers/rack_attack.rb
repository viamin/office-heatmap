class Rack::Attack
  # Throttle POST /votes by IP to 30 req/hour
  throttle('votes/ip', limit: 30, period: 1.hour) do |req|
    req.ip if req.post? && req.path.start_with?('/votes')
  end
end
