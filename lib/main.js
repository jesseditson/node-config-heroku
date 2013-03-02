// Main config loader - uses either config files if in dev mode or heroku config if on heroku.

var configCache

var loadConfig = function(grunt){
  if(configCache) return configCache
  if(process.env.CONFIG_VAR && process.env.PORT){
    console.log('heroku environment detected. Using config '+process.env.CONFIG_VAR)
    // we appear to be on heroku. parse out the config var.
    var config = process.env[process.env.CONFIG_VAR]
    if(config){
      configCache = JSON.parse(config)
    } else {
      throw new Error("Failed to load config var "+process.env.CONFIG_VAR+". Perhaps you haven't set the CONFIG_VAR variable to a valid config?")
    }
  } else {
    // console.log('loading config using node-config')
    configCache = require('./loadConfig')
  }
  // console.log('loaded config: \n'+JSON.stringify(configCache,null,4))
  return configCache
}

module.exports = loadConfig()