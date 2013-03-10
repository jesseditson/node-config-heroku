// Grunt task for updating heroku config from local config.

// Dependencies
var save = require('../lib/commands/save')

module.exports = function(grunt){
  if(!grunt) return false
  
  grunt.registerMultiTask('config-heroku', 'Save local config to heroku.', function() {
    var done = this.async()
    var config = this.data
    grunt.log.writeln('Saving local config to Heroku...'.blue)
    save.call(grunt, config, function(conf,cb){ return cb(true) }, function(success){
      grunt.log.writeln("Completed saving config.".blue)
      done(success)
    })
  });
}