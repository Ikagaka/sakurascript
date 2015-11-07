module.exports = (config) ->
  config.set
    basePath: ''
    frameworks: [ 'detectBrowsers', 'mocha-debug', 'mocha' ]
    files: [
      'node_modules/power-assert/build/power-assert.js'
      'src/**/*.coffee'
      'test/**/*.coffee'
    ]
    exclude: [ '**/*.swp' ]
    preprocessors:
      'src/**/*.coffee': [ 'coffee', 'coverage' ]
      'test/**/*.coffee': [ 'coffee', 'espower' ]
    espowerPreprocessor:
      transformPath: (path) ->
        path.replace /\.coffee$/, '.espower'
    coverageReporter:
      reporters: [{type: 'lcov'}]
    reporters: [ 'progress', 'coverage' ]
    port: 9876
    colors: true
    logLevel: config.LOG_INFO
    autoWatch: true
    browsers: [ ]
    singleRun: false
    concurrency: Infinity
