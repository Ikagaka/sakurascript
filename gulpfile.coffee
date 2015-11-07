path = require 'path'
gulp = require 'gulp'
merge = require 'merge-stream'
$ = (require 'gulp-load-plugins')()
require 'espower-coffee/guess'
process.env.COFFEECOV_INIT_ALL = "false"
require 'coffee-coverage/register-istanbul'
Server = require('karma').Server
package_json = require './package.json'

files =
  src:
    js: 'src/**/*.js'
    coffee: 'src/**/*.coffee'
  dst:
    js: 'lib/**/*.js'
  test:
    coffee: 'test/**/*.coffee'

dirs =
  src: 'src'
  dst: 'lib'

gulp.task 'default', ['build']

gulp.task 'js', ->
  coffee = gulp.src files.src.coffee
    .pipe $.sourcemaps.init()
    .pipe $.coffee()
  coffeeu = coffee.pipe $.clone()
  merge [
    gulp.src files.src.js
      .pipe $.sourcemaps.init()
      .pipe gulp.dest dirs.dst
      .pipe $.uglify()
      .pipe $.rename extname: '.min.js'
      .pipe $.sourcemaps.write('.')
      .pipe gulp.dest dirs.dst
    coffee
      .pipe $.sourcemaps.write('.')
      .pipe gulp.dest dirs.dst
    coffeeu
      .pipe $.uglify()
      .pipe $.rename extname: '.min.js'
      .pipe $.sourcemaps.write('.')
      .pipe gulp.dest dirs.dst
  ]

gulp.task 'build', ['js', 'test-cli', 'cov', 'test-browser', 'doc']

gulp.task 'test', ['test-cli', 'test-browser']

gulp.task 'test-cli', ->
  gulp.src files.test.coffee
    .pipe $.mocha()

gulp.task 'test-browser', ['test-cli'], (done) ->
  new Server
    configFile: "#{__dirname}/karma.conf.coffee"
    singleRun: true
  , done
    .start()

gulp.task 'test-browser-cli', ['test-cli'], (done) ->
  new Server
    configFile: "#{__dirname}/karma.conf.coffee"
    singleRun: true
    frameworks: [ 'mocha-debug', 'mocha' ]
    browsers: ['PhantomJS']
  , done
    .start()

gulp.task 'test-browser-watch', ['test-cli'], (done) ->
  new Server
    configFile: "#{__dirname}/karma.conf.coffee"
  , done
    .start()

gulp.task 'cov', ['test-cli'], ->
  gulp.src files.src.coffee
    .pipe $.shell [path.join('node_modules/.bin/istanbul') + ' report']

gulp.task 'doc', ->
  gulp.src files.src.coffee, read: false
    .pipe $.codo
      name: package_json.name
      title: package_json.name

gulp.task 'watch', ->
  gulp.start ['js', 'test-cli', 'test-browser-watch', 'doc']
  $.watch [files.src.js, files.src.coffee, files.test.coffee], -> gulp.start ['js', 'test-cli', 'doc']
