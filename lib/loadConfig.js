// Load Config
// this used to use the 'config' module, but now just does some very simple config loading to make things easier to work with in test environments and stuff.

var fs = require('fs')
var path = require('path')

var DEFAULT_CLONE_DEPTH = 6
var DIR = 'NODE_CONFIG_DIR'
var CONFIG_DIR = process.env[DIR] || process.cwd() + '/config'
var RUNTIME = 'NODE_CONFIG_RUNTIME_JSON'
var defaultJsonFilename = 'default.json'
var runtimeJsonFilename = process.env[RUNTIME] || CONFIG_DIR + '/runtime.json'
var config

var Config = function(){
  if(!config) init.call(this)
  return this
}

// reload - force a reload of the config
Config.prototype.reload = function(){
  init.call(this)
  return this
}

// Extend deep from config:
/**
 * Extend an object, and any object it contains.
 *
 * This does not replace deep objects, but dives into them
 * replacing individual elements instead.
 *
 * @protected
 * @method _extendDeep
 * @param mergeInto {object} The object to merge into
 * @param mergeFrom... {object...} - Any number of objects to merge from
 * @param depth {integer} An optional depth to prevent recursion.  Default: 20.
 * @return {object} The altered mergeInto object is returned
 */
Config.prototype._extendDeep = function(mergeInto) {

  // Initialize
  var t = this;
  var vargs = Array.prototype.slice.call(arguments, 1);
  var depth = vargs.pop();
  if (typeof(depth) != 'number') {
    vargs.push(depth);
    depth = DEFAULT_CLONE_DEPTH;
  }

  // Recursion detection
  if (depth < 0) {
    return mergeInto;
  }

  // Cycle through each object to extend
  vargs.forEach(function(mergeFrom) {

    // Cycle through each element of the object to merge from
    for (var prop in mergeFrom) {

      // Extend recursively if both elements are objects
      if (t._isObject(mergeInto[prop]) && t._isObject(mergeFrom[prop])) {
        t._extendDeep(mergeInto[prop], mergeFrom[prop], depth - 1);
      }

      // Copy recursively if the mergeFrom element is an object (or array or fn)
      else if (mergeFrom[prop] && typeof mergeFrom[prop] == 'object') {
        mergeInto[prop] = t._cloneDeep(mergeFrom[prop], depth - 1);
      }

      // Simple assignment otherwise
      else {
        mergeInto[prop] = mergeFrom[prop];
      }
    }
  });

  // Chain
  return mergeInto;

};
Config.prototype._cloneDeep = function(obj, depth) {

  // Recursion detection
  var t = this;
  depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
  if (depth < 0) {
    return {};
  }

  // Create the copy of the correct type
  var copy = Array.isArray(obj) ? [] : {};

  // Cycle through each element
  for (var prop in obj) {

    // Call recursively if an object or array
    if (obj[prop] && typeof obj[prop] == 'object') {
      copy[prop] = t._cloneDeep(obj[prop], depth - 1);
    }
    else {
      copy[prop] = obj[prop];
    }
  }

  // Return the copied object
  return copy;

};
Config.prototype._isObject = function(obj) {
  return (obj !== null) && (typeof obj == 'object') && !(Array.isArray(obj));
};

// Private:

// overload current config with a new file if it exists.
// return status of that try.
var overloadConfig = function(name,filePath){
  if(fs.existsSync(filePath)){
    try {
      var loadedConfig = JSON.parse(fs.readFileSync(filePath))
      this._extendDeep(config,loadedConfig)
      return true
    } catch(e){
      if(e) throw new Error("Failed loading "+name+" config. Error:" + e.stack)
    }
  }
  return false
}

// synchronous init
var init = function(){
  // look at the files in the config dir
  var files = fs.statSync(CONFIG_DIR)
  // set up default config obj
  config = {}
  // load default first if it exists
  var defaultPath = path.join(CONFIG_DIR,defaultJsonFilename)
  overloadConfig.call(this,'default',defaultPath)
  // check the NODE_ENV, if it is set, load that config. If not or if that config does not exist, use runtime.json
  if(process.env.NODE_ENV && process.env.NODE_ENV.length){
    var overloadPath = path.join(CONFIG_DIR,process.env.NODE_ENV + '.json')
    if(overloadConfig.call(this,process.env.NODE_ENV,overloadPath)){
      // successfully overridden. Return without loading runtime.
      return reloadConfig.call(this)
    }
  }
  overloadConfig.call(this,'runtime',runtimeJsonFilename)
  return reloadConfig.call(this)
}

var reloadConfig = function(){
  Object.keys(config).forEach(function(key){
    this[key] = config[key]
  }.bind(this))
  return this
}

global.CONFIG_HEROKU = global.CONFIG_HEROKU || new Config()

module.exports = global.CONFIG_HEROKU