node-config-heroku
==================

An adapter for [node-config](https://github.com/lorenwest/node-config) that sticks configs in heroku env variables instead of reading from the FS.

Usage
=====

add it to your `package.json`, and use it exactly like [node-config](https://github.com/lorenwest/node-config):

    npm install --save config-heroku

    var config = require('config-heroku')

As config-heroku is api compatible with config, you can just globally find & replace `require('config')` with `require('config-heroku')` to achieve heroku compatibility.

As you'll want a heroku specific config, add a `heroku.json` file to your `config` folder. It'll act like a `production.json`, just only when it's up on heroku. You can add different ones if you want staging/prod setup (see [Black Belt Usage](#black-belt-usage) below).

You'll need to set up the command line tool to package up your config - you can install it everywhere using:

    npm install -g config-heroku

When you're ready to deploy, move the current config over to a heroku environment variable by runnning the `save` command:

    config-heroku save

You can now safely deploy to heroku and your config will be there.

Commit hook
===========

Just in case you didn't want to run `save` every time you update your config, node-config can auto-install a git hook that will take care of auto updating the variable:

    hook add

Oops, you changed your mind? It's ok, config-heroku can clean up after itself:

    hook remove

No more hook!

Grunt
=====

This config-heroku also has a grunt task - you can use it like so:


    grunt.loadNpmTasks('config-heroku')

then later in your config:

    grunt.initConfig({
      'config-heroku' : {
        configname : 'heroku',
        varname : '<%= grunt.config("config-heroku").configname.toUpperCase() %>_CONFIG'
      }
    })

Now you can automatically update the heroku config vars when building.

Black-Belt Usage
================

You're not convinced. What is the variable called? How does this work?

Don't worry, young grasshoper, here are answers:

- By default, config-heroku will save it's info as JSON in a variable called "HEROKU_CONFIG".

- When saving, config-heroku will read from `config/heroku.json` (after inheriting default.json like node-config does) unless specified.

- You can save and specify which config you'd like to save, using `config-heroku save somename`. This will now save using the `config/somename.json` file instead.

- If you don't like the name `HEROKU_CONFIG`, you can change that too. Just use `config-heroku save somename MY_VARNAME`. Now you'll have a shiny new environment variable with your special config in it called `MY_VARNAME`.

- Config always defaults to looking for the `HEROKU_CONFIG` variable. If you want to switch the current app to use something else, you can switch it using `config-heroku use MY_VARNAME`. Now your app will use the `MY_VARNAME` config instead of the `HEROKU_CONFIG` one.

- Now you've got a bunch of names to remember and your hook is broken. Don't worry, the `hook` command accepts the same arguments as `save` - you can simply `config-heroku hook add somename MY_VARNAME`. Now when you commit, the `MY_VARNAME` config is updated to the info in `config/somename.json`.


I work for devops and prefer non-markdown formatted documentation
=================================================================

Ok, smarty pants. Hit `config-heroku` with no arguments and it'll spit out this info (you can also specify `-h` or `--help`, doesn't matter to me.):


    Usage: config-heroku [options] [command]

    Commands:

      save [configname] [varname] [yes]
      save closest found production config to heroku env. Var name defaults to "[configname]_CONFIG", configname defaults to "heroku", yes will always save.
    
      hook [add] [configname] [varname]
      adds or removes git hook to re-save configs with specified arguments to the nearest .git directory. Use "hook add or hook remove"
    
      use [varname]
      tell heroku which config variable to use.

    Options:

      -h, --help  output usage information

That's all.

Github issues is a fine place to put bugs for this project if you find them.

Jesse Ditson

jesse.ditson@gmail.com

[@jesseditson](http://twitter.com/jesseditson)
