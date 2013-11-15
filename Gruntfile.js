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
          livereload: true
        }
      },
      javascript: {
        files: 'src/javascript/*.js',
        tasks: ['concat', 'jshint'],
        options: {
          livereload: true
        }
      }
    },

    nodestatic: {
      usesDefaults: {}
    },

    browserify: {
      all: {
        src: 'src/javascript/main.js',
        dest: 'dist/<%= pkg.name.replace(".js", "") %>.js',
        options: {
          transform: ['debowerify','deamdify'],
          shim: {
            Swipe: {
              path: 'lib/swipe.js',
              exports: 'Swipe'
            }
          },
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
  grunt.loadNpmTasks('grunt-nodestatic');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('server',  'Hosts project on port 8080,\n' +
                                'watches /src files and concats, lints\n' +
                                'and triggers LiveReload if enabled in your browser.',
                                    ['nodestatic','watch']);

  grunt.registerTask('test',    'Run jshint and qunit tests.',
                                    ['jshint', 'qunit']);

  grunt.registerTask('build',   'Compiles, concatinates and minifies scss and javascript.',
                                    ['sass','concat', 'jshint', 'qunit', 'uglify']);
  
  grunt.registerTask('default', 'Compiles, concatinates and minifies javascript',
                                    ['jshint', 'browserify', 'qunit', 'uglify']);

};
