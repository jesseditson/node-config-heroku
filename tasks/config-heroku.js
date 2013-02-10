// Grunt task for updating heroku config from local config.

// Dependencies
var save = require('../lib/commands/save')

module.exports = function(grunt){
  if(!grunt) return false
  
  function getConfig () {
    var config = grunt.config('config-heroku') || {};

    // Look for and process grunt template stings
    var keys = ['configname', 'varname'];
    keys.forEach(function(key) {
      if (config.hasOwnProperty(key)) {
        config[key] = grunt.template.process(config[key]);
      }
    });
    return config
  }
  
  grunt.registerTask('config-heroku', 'Save local config to heroku.', function() {
    var done = this.async()
    var config = getConfig()
    grunt.log.writeln('Saving local config to Heroku...'.blue)
    save.call(grunt,config, function(conf,cb){ return cb(true) }, function(){
      grunt.log.writeln("Completed saving config.".blue)
      done()
    })
  });
}