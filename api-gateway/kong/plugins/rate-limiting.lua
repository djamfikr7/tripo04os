local BasePlugin = require "kong.plugins.base_plugin"
local limit_req = require "resty.limit.req"
local limit_conn = require "resty.limit.conn"
local limit_traffic = require "resty.limit.traffic"

local rate_limiting = BasePlugin:extend()

rate_limiting.PRIORITY = 1001
rate_limiting.VERSION = "1.0.0"

function rate_limiting:new()
  rate_limiting.super.new(self, "rate-limiting")
end

function rate_limiting:init_worker()
  local limiter, err = limit_req.new("kong_rate_limiting", 100, 60)
  if not limiter then
    kong.log.err("failed to instantiate rate limiter: ", err)
    return
  end

  kong.ctx.shared.rate_limiter = limiter
end

function rate_limiting:access(conf)
  local limiter = kong.ctx.shared.rate_limiter

  if not limiter then
    kong.log.warn("rate limiter not initialized")
    return
  end

  local identifier = kong.client.get_ip() or "unknown"

  local delay, err = limiter:incoming(identifier, true)
  if not delay then
    if err == "rejected" then
      return kong.response.error(429, "Too Many Requests")
    else
      kong.log.err("failed to limit rate: ", err)
    end
  end
end

return rate_limiting
