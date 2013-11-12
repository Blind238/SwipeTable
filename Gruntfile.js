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
      files: ['dist/SwipeTable.js'],
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
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-nodestatic');

  grunt.registerTask('server', ['nodestatic','watch']);
  grunt.registerTask('test', ['jshint', 'qunit']);
  grunt.registerTask('build', ['sass','concat', 'jshint', 'qunit', 'uglify']);
  grunt.registerTask('default', ['concat', 'jshint', 'qunit', 'uglify']);

};
