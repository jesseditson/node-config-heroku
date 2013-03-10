// Save command - saves a local config to heroku config.

// Dependencies
var fs = require('fs')
var path = require('path')
var exec = require('child_process').exec
var helpers = require('../helpers')

var verified = false

var saveCommand = module.exports = function(options,confirm,callback){
  var configname = options.configname
  var varname = options.varname
  var app = options.app
  var configDir = options.configDir || helpers.findFile('config','dir')
  var grunt = this
  // log
  var log = {
    write : function(){
      if(grunt.log && grunt.log.writeln) return grunt.log.writeln.apply(grunt.log,arguments)
      console.log.apply(console,arguments)
    },
    warn : function(){
      if(grunt.log && grunt.log.warn) return grunt.log.warn.apply(grunt.log,arguments)
      console.warn.apply(console,arguments)
    },
    error : function(){
      if(grunt.log && grunt.log.error) return grunt.log.error.apply(grunt.log,arguments)
      console.error.apply(console,arguments)
    },
    ok : function(){
      if(grunt.log && grunt.log.ok) return grunt.log.ok.apply(grunt.log,arguments)
      console.log.apply(console,arguments)
    },
    verbose : function(){
      if(grunt.verbose && grunt.verbose.writeln) return grunt.verbose.writeln.apply(grunt.verbose,arguments)
      console.log.apply(console,arguments)
    }
  }
  
  // make sure we're in a heroku app before running.
  if(!verified){
    return helpers.verifyHerokuApp.call(grunt,app,function(ok){
      verified = ok
      if(!ok){
        log.error('Error verifying heroku app & config. Cannot save config.')
        return callback(false)
      }
      saveCommand.call(grunt,options,confirm,callback)
    }.bind(grunt))
  }
  
  // called when script is done running.
  var currentlyUsing
  var initialEnv = process.env.NODE_ENV
  var done = function(err){
    if(err){
      log.error("Error saving config: " + (err.message || err))
    } else {
      log.verbose("Heroku is currently using the "+currentlyUsing+" config. Use 'config-heroku use <var>' to change.")
    }
    // restore global config
    process.env.NODE_ENV=initialEnv
    helpers.reloadConfig(grunt)
    callback(!err)
  }
  
  configname = configname || "heroku"
  varname = varname || configname.toUpperCase() + "_CONFIG"
  if(!(fs.existsSync || path.existsSync)(configDir + '/config/' +configname+ '.json')){
    log.warn("Config file '"+configname+".json' not found. Generating empty config file.")
    fs.writeFileSync(configDir + '/config/' +configname+ '.json',"{}","utf-8")
  }
  try {
    var herokuConfig = JSON.parse(fs.readFileSync(configDir + '/config/' +configname+ '.json','utf-8'))
  } catch(e){
    return done("Invalid heroku config file. Failed parsing with error: "+e.message)
  }
  
  // overload config with current configname
  process.env.NODE_ENV=configname
  var config = helpers.reloadConfig(grunt)
  
  var save = function(complete){
    log.verbose("Saving local config to heroku config...")
    var cmd = 'heroku'
    cmd += ' config:add '+varname+"='"+JSON.stringify(config)+"'"
    if(app) cmd += " --app " + app
    exec(cmd,function(err,stdout,stderr){
      if(err) throw err
      log.verbose("Done saving. Response:\n"+(stdout || stderr))
      cmd = 'heroku'
      if(app) cmd += " --app " + app
      cmd += ' config:get CONFIG_VAR'
      exec(cmd,function(err,stdout,stderr){
        currentlyUsing = stdout.replace(/^[\n\s]*(.*)[\n\s]*$/,'$1')
        if(!currentlyUsing){
          helpers.setConfig(varname,app,function(){
            currentlyUsing = varname
            done()
          })
        } else {
          done()
        }
      })
    })
  }
  confirm(config,function(ok){
    if(ok){
      save()
    } else {
      done("failed verification")
    }
  })
}