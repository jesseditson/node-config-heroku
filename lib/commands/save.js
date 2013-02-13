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
    return helpers.verifyHerokuApp.call(grunt,function(ok){
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
  var done = function(err){
    // restore runtime
    if((fs.existsSync || path.existsSync)(configDir + '/__runtime.json')){
      try {
        fs.unlinkSync(configDir + '/runtime.json');
      } catch(e) {
        // runtime.json was generated during script, remove it.
      }
      fs.renameSync(configDir + '/__runtime.json',configDir + '/config/runtime.json')
    }
    if(err){
      log.error("Error saving config: " + (err.message || err))
    } else {
      log.verbose("Heroku is currently using the "+currentlyUsing+" config. Use 'config-heroku use <var>' to change.")
    }
    // restore global config
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
  // set up process to indicate the correct config dir
  process.env.NODE_CONFIG_DIR=configDir + '/config'
  // replace current runtime with empty config
  if((fs.existsSync || path.existsSync)(configDir + '/config/runtime.json')){
    fs.renameSync(configDir + '/config/runtime.json',configDir + '/__runtime.json')
    fs.writeFileSync(configDir + '/config/runtime.json','{}','utf-8')
  }
  var config = helpers.reloadConfig(grunt)
  // overload config with heroku config
  Object.keys(herokuConfig).forEach(function(k){
    config[k] = herokuConfig[k]
  })
  var save = function(complete){
    log.verbose("Saving local config to heroku config...")
    exec('heroku config:add '+varname+"='"+JSON.stringify(config)+"'",function(err,stdout,stderr){
      if(err) throw err
      log.verbose("Done saving. Response:\n"+(stdout || stderr))
      exec('heroku config:get CONFIG_VAR',function(err,stdout,stderr){
        currentlyUsing = stdout.replace(/^[\n\s]*(.*)[\n\s]*$/,'$1')
        if(!currentlyUsing){
          setConfig(varname,function(){
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