fs = require 'fs'
path = require 'path'
gulp = require 'gulp'
merge = require 'merge-stream'
rimraf = require 'rimraf'
$ = (require 'gulp-load-plugins')()
require 'espower-coffee/guess'
Server = require('karma').Server
package_json = require './package.json'

coffeeCoverage = require 'coffee-coverage'
coffeeCoverage.register
  instrumentor: 'istanbul'
  basePath: process.cwd()
  exclude: ['/gulpfile.coffee', '/karma.conf.coffee', '/test', '/node_modules', '/.git']
  coverageVar: undefined
  writeOnExit: null
  initAll: false

files =
  src:
    js: 'src/**/*.js'
    coffee: 'src/**/*.coffee'
  test:
    coffee: 'test/**/*.coffee'
  coverage: 'coverage/coverage-coffee.json'
  doc: 'doc/**/*'

dirs =
  src: 'src'
  dst: '.'

gulp.task 'default', ['build']

gulp.task 'js', ->
  coffee = gulp.src files.src.coffee, base: dirs.src
    .pipe $.sourcemaps.init()
    .pipe $.coffee()
  coffeeu = coffee.pipe $.clone()
  merge [
    coffee
      .pipe $.sourcemaps.write('.')
      .pipe gulp.dest dirs.dst
    coffeeu
      .pipe $.uglify()
      .pipe $.rename extname: '.min.js'
      .pipe $.sourcemaps.write('.')
      .pipe gulp.dest dirs.dst
  ]

gulp.task 'build', ['js', 'test', 'doc']

gulp.task 'test', ['test-node', 'test-browser']
gulp.task 'test-cli', ['test-node', 'test-browser-cli']

gulp.task 'test-node', ->
  gulp.src files.test.coffee, read: false
    .pipe $.mocha()
    .on 'end', ->
      cov_dir = path.dirname(files.coverage)
      unless fs.existsSync cov_dir
        fs.mkdirSync cov_dir
      fs.writeFileSync files.coverage, JSON.stringify _$coffeeIstanbul
      gulp.src "coverage/coverage-coffee.json"
        .pipe $.istanbulReport
          reporters: [
            {name: 'text'}
            {name: 'lcov'}
          ]

gulp.task 'test-browser', (done) ->
  new Server
    configFile: "#{__dirname}/karma.conf.coffee"
    singleRun: true
  , done
    .start()

gulp.task 'test-browser-cli', (done) ->
  new Server
    configFile: "#{__dirname}/karma.conf.coffee"
    singleRun: true
    frameworks: [ 'mocha-debug', 'mocha' ]
    browsers: ['PhantomJS']
  , done
    .start()

gulp.task 'test-browser-watch', (done) ->
  new Server
    configFile: "#{__dirname}/karma.conf.coffee"
  , done
    .start()

gulp.task 'lint', ->
  gulp.src files.src.coffee
    .pipe $.coffeelint()
    .pipe $.coffeelint.reporter()

gulp.task 'clean-doc', (done) ->
  rimraf files.doc, done

gulp.task 'doc', ['clean-doc'], ->
  gulp.src files.src.coffee, read: false, base: dirs.src
    .pipe $.codo
      name: package_json.name
      title: package_json.name

gulp.task 'watch', ->
  gulp.start ['js', 'test-node', 'test-browser-watch', 'doc']
  $.watch [files.src.coffee, files.test.coffee], -> gulp.start ['js', 'test-node', 'doc']
