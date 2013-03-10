// **Helpers**

var exec = require('child_process').exec
var fs = require('fs')

var reloadConfig = module.exports.reloadConfig = function(grunt){
  return require('./loadConfig').reload()
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
var setConfig = module.exports.setConfig = function(varname,app,done){
  var cmd = 'heroku'
  cmd += ' config:add CONFIG_VAR='+varname
  if(app) cmd += " --app " + app
  exec(cmd,function(err,saved,stderr){
    ((this.log && this.log.writeln) || console.log)('updated CONFIG_VAR.')
    done()
  })
}

// verify that we're inside a heroku app
var verifyHerokuApp = module.exports.verifyHerokuApp = function(app,cb){
  var log = ((this.verbose && this.verbose.writeln.bind(this.verbose)) || console.log)
  var error = ((this.log && this.log.error.bind(this.log)) || console.error)
  log("looking up heroku app...")
  var cmd = 'heroku config'
  if(app) cmd += " --app " + app
  exec(cmd,function(err,stdout,stderr){
    if(err || stderr){
      error(err || stderr)
      cb(false)
    } else {
      cb(true)
    }
  })
}