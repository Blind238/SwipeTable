var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir),{ maxAge : 0 });
};

module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: "\n\n"
      },
      dist: {
        src: [
          'src/javascript/main.js'
        ],
        dest: 'dist/<%= pkg.name.replace(".js", "") %>.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name.replace(".js", "") %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name.replace(".js", "") %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },

    qunit: {
      files: ['test/*.html']
    },

    jshint: {
      files: ['src/javascript/main.js'],
      options: {
        globals: {
          console: true,
          module: true,
          document: true
        },
        jshintrc: '.jshintrc'
      }
    },

    sass: {
      dist: {
        options: {
          sourcemap: true,
          style: 'nested'
        },
        files: {
          'dist/swipetable.css': 'src/scss/style.scss'
        }
      }
    },

    watch: {
      scss: {
        files: 'src/scss/*.scss',
        tasks: ['sass'],
        options: {
          livereload: LIVERELOAD_PORT
        }
      },
      javascript: {
        files: 'src/javascript/*.js',
        tasks: ['jshint', 'browserify'],
        options: {
          livereload: LIVERELOAD_PORT
        }
      }
    },

    connect: {
      options: {
        port: 8080,
        // access the server from outside
        hostname: '0.0.0.0'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, './')
            ];
          }
        }
      }
    },

    browserify: {
      all: {
        src: 'src/javascript/main.js',
        dest: 'dist/<%= pkg.name.replace(".js", "") %>.js',
        options: {
          transform: ['debowerify','deamdify'],
          standalone: 'SwipeTable'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('server',  'Hosts project on port 8080,\n' +
                                'watches /src files and concats, lints\n' +
                                'and triggers LiveReload if enabled in your browser.',
                                    ['connect:livereload','watch']);

  grunt.registerTask('test',    'Run jshint and qunit tests.',
                                    ['jshint', 'browserify', 'qunit']);

  grunt.registerTask('build',   'Compiles and minifies scss and javascript.',
                                    ['sass', 'jshint', 'browserify', 'qunit', 'uglify']);
  
  grunt.registerTask('default', 'Compiles and minifies javascript',
                                    ['jshint', 'browserify', 'qunit', 'uglify']);

};
