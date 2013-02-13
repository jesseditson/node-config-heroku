// **Helpers**

var exec = require('child_process').exec
var fs = require('fs')

var reloadConfig = module.exports.reloadConfig = function(grunt){
  // invalidate cache for currently loaded config module to ensure we're getting a fresh instance (without runtime.json)
  Object.keys(require.cache).forEach(function(p){
    if(/node_modules\/config\/lib\/config.js/.test(p)){
      if(grunt && grunt.verbose) grunt.verbose.writeln("invalidating cache for loaded config: "+p)
      require.cache[p] = null
      delete require.cache[p]
    }
  })
  global.NODE_CONFIG = null
  delete global.NODE_CONFIG
  
  var config = require('config')
  config.watchForConfigFileChanges(0)
  config._loadFileConfigs()
  config = config._cloneDeep(config)
  return config
}

// find the closest dir containing a file or folder, locate ourselves there
var findFile = module.exports.findFile = function(search,type,path){
  var thisdir = path || process.cwd()
  var searchdir = thisdir + '/' + search
  try {
      stats = fs.lstatSync(searchdir)
      if (type == "dir" && stats.isDirectory()) {
        return thisdir
      } else if(type == "file" && stats.isFile()) {
        return thisdir
      }
  } catch (e) {
    var parts = thisdir.split('/')
    parts.pop()
    if(parts.length > 1){
      return findFile(search,type,parts.join('/'))
    } else {
      return false
    }
  }
}

// tell heroku which config to use
var setConfig = module.exports.setConfig = function(varname,done){
  exec('heroku config:add CONFIG_VAR='+varname+'',function(err,saved,stderr){
    ((this.log && this.log.writeln) || console.log)('updated CONFIG_VAR.')
    done()
  })
}

// verify that we're inside a heroku app
var verifyHerokuApp = module.exports.verifyHerokuApp = function(cb){
  var log = ((this.verbose && this.verbose.writeln.bind(this.verbose)) || console.log)
  var error = ((this.log && this.log.error.bind(this.log)) || console.error)
  log("looking up heroku app...")
  exec('heroku config',function(err,stdout,stderr){
    if(err || stderr){
      error(err || stderr)
      cb(false)
    } else {
      cb(true)
    }
  })
}