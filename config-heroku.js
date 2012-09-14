// **Config Heroku**
// ---
// an adapter for using node-config on heroku installs

// **Choose a script**
if(require.main === module){
  // **cli script**
  module.exports = require('./lib/cli')(__dirname + '/../package.json')
} else {
  // **require'd script**
  module.exports = require('./lib/main')
}