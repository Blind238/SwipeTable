/*
 * Generated on 2013-12-13
 * generator-assemble v0.4.3
 * https://github.com/assemble/generator-assemble
 *
 * Copyright (c) 2013 Jeremy Granadillo
 * Licensed under the MIT license.
 */

'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// '<%= config.src %>/templates/pages/{,*/}*.hbs'
// use this if you want to match all subfolders:
// '<%= config.src %>/templates/pages/**/*.hbs'

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    config: {
      src: 'src',
      dist: 'dist'
    },

    watch: {
      assemble: {
        files: ['<%= config.src %>/{content,data,templates,pages}/{,*/}*.{md,hbs,yml}'],
        tasks: ['assemble']
      },
      scss: {
        files: '<%= config.src %>/scss/*.scss',
        tasks: ['sass', 'autoprefixer', 'cssmin:dev'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= config.dist %>/{,*/}*.html',
          '<%= config.dist %>/assets/{,*/}*.css',
          '<%= config.dist %>/assets/{,*/}*.js',
          '<%= config.dist %>/assets/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    sass: {
      dist: {
        options: {
          style: 'nested'
        },
        files: [{
                expand: true,
                cwd: '<%= config.src %>/scss',
                src: ['*.scss'],
                dest: '<%= config.dist %>/assets',
                ext: '.css'
              }]
      }
    },

    autoprefixer: {
      options: {
        browsers: ['last 1 version', 'android 4']
      },
      dist: {
        src: '<%= config.dist %>/assets/*.css'
      }
    },

    cssmin: {
      dev: {
        files: [{
                expand: true,
                cwd: '<%= config.dist %>/assets',
                src: ['*.css', '!*.min.css'],
                dest: '<%= config.dist %>/assets',
                ext: '.min.css'
        }]
      },
      dist: {
        options: {
          report: 'gzip'
        },
        files: [{
                expand: true,
                cwd: '<%= config.dist %>/assets',
                src: ['*.css', '!*.min.css'],
                dest: '<%= config.dist %>/assets',
                ext: '.min.css'
        }]
      }
    },

    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      livereload: {
        options: {
          open: true,
          base: [
            '<%= config.dist %>'
          ]
        }
      }
    },

    assemble: {
      options: {
        flatten: true,
        assets: '<%= config.dist %>/assets',
        layoutdir: '<%= config.src %>/templates/layouts',
        data: '<%= config.src %>/data/*.{json,yml}',
        partials: '<%= config.src %>/templates/partials/*.hbs',
        plugins: ['assemble-contrib-anchors','assemble-contrib-permalinks','assemble-contrib-sitemap','assemble-contrib-toc','assemble-markdown-data','assemble-related-pages'],
      },
      main: {
        options:{
          layout: 'main.hbs',
          partials: '<%= config.src %>/pages/main/*.hbs'
        },
        files: {
          '<%= config.dist %>/': ['<%= config.src %>/pages/index.hbs']
        }
      },
      devlogs: {
        options:{
          layout: 'devlog.hbs'
        },
        files: {
          '<%= config.dist %>/devlog/': ['<%= config.src %>/pages/devlogs/*.md']
        }
      }

    },

    // Before generating any new files,
    // remove any previously-created files.
    clean: ['<%= config.dist %>/**/*.{html,xml,css}'],

    // Push dist files to gh-pages branch of the current repo
    'gh-pages': {
      options: {
        base: '<%= config.dist %>'
      },
      src: ['**']
    }

  });

  grunt.loadNpmTasks('assemble');
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('server', [
    'build',
    'connect:livereload',
    'watch'
  ]);

  grunt.registerTask('build', [
    'clean',
    'sass', 'autoprefixer', 'cssmin:dist',
    'assemble'
  ]);

  grunt.registerTask('deploy', [
    'build',
    'gh-pages'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);

};
