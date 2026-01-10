local BasePlugin = require "kong.plugins.base_plugin"
local jwt = require "resty.jwt"

local jwt_plugin = BasePlugin:extend()

jwt_plugin.PRIORITY = 1005
jwt_plugin.VERSION = "1.0.0"

function jwt_plugin:new()
  jwt_plugin.super.new(self, "jwt")
end

function jwt_plugin:access(conf)
  local token = kong.request.get_header("Authorization")

  if not token then
    return kong.response.error(401, "Unauthorized: No token provided")
  end

  token = token:gsub("^Bearer ", "")

  local jwt_obj = jwt:verify(conf.secret, token)

  if not jwt_obj.valid then
    return kong.response.error(401, "Unauthorized: Invalid token")
  end

  kong.ctx.shared.jwt_claims = jwt_obj.payload
end

function jwt_plugin:response(conf)
  local claims = kong.ctx.shared.jwt_claims

  if claims then
    kong.response.set_header("X-User-Id", claims.sub or "")
    kong.response.set_header("X-User-Role", claims.role or "")
  end
end

return jwt_plugin
