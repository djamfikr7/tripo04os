local BasePlugin = require "kong.plugins.base_plugin"
local response_logger = require "kong.plugins.response-logger.handler"

local response_logger = BasePlugin:extend()

response_logger.PRIORITY = 999
response_logger.VERSION = "1.0.0"

function response_logger:new()
  response_logger.super.new(self, "response-logger")
end

function response_logger:log(conf)
  kong.log.info("[RESPONSE-LOGGER] Response status: ", kong.response.get_status())
  kong.log.info("[RESPONSE-LOGGER] Response headers: ", kong.response.get_headers())
  kong.log.info("[RESPONSE-LOGGER] Response body: ", kong.service.response.get_raw_body())

  local request_time = ngx.now() - (ngx.req.start_time() or ngx.now())
  kong.log.info("[RESPONSE-LOGGER] Total response time: ", request_time, "s")
end

return response_logger
