local BasePlugin = require "kong.plugins.base_plugin"
local request_logger = require "kong.plugins.request-logger.handler"

local request_logger = BasePlugin:extend()

request_logger.PRIORITY = 1000
request_logger.VERSION = "1.0.0"

function request_logger:new()
  request_logger.super.new(self, "request-logger")
end

function request_logger:access(conf)
  kong.log.info("[REQUEST-LOGGER] ", kong.request.get_method(), " ", kong.request.get_path())
  kong.log.info("[REQUEST-LOGGER] Headers: ", kong.request.get_raw_headers())
  kong.log.info("[REQUEST-LOGGER] Body: ", kong.request.get_raw_body())

  kong.ctx.plugin.request_start_time = ngx.now()
end

function request_logger:log(conf)
  local request_time = ngx.now() - (kong.ctx.plugin.request_start_time or ngx.now())

  kong.log.info("[REQUEST-LOGGER] Response status: ", kong.response.get_status())
  kong.log.info("[REQUEST-LOGGER] Response time: ", request_time, "s")
end

return request_logger
