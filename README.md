# SwipeTable

Mobile oriented AJAX table

## About

A JavaScript library by Jeremy Granadillo.

See the [project homepage](http://swipetable.blind238.com).

## Installation

<!-- Using Bower:

    bower install SwipeTable

Or -->
Grab the [source](https://github.com/blind238/SwipeTable/dist/SwipeTable.js) ([minified](https://github.com/blind238/SwipeTable/dist/SwipeTable.min.js)).

## Usage

Usage is as follows:

Place this HTML snippet where you want the table:

    <div class="swipe-table  st-##">
    </div>

`st-##` sets the size of the pinned column as a percentage of the table.
Replace `##` with a number between 10 and 35 in 5 increments.

Load the script just before the `</body>` closing tag, then use the following to config and start the table:

    <script>
      (function(root){

          var restApiUrl = 'http://swipetable.blind238.com/api';
          var keys = [
            "id", // this is the 'pinned' column
            "some",
            "demo",
            "dummy",
            "data"
          ];
          var stElem = document.getElementsByClassName('swipe-table')[0];
          var options = {
            fullscreen: true //default
          };

          root.SwipeTable = new SwipeTable(restApiUrl, keys, stElem, options);

      }(this));
    </script>
<!-- For advanced usage, see the documentation. -->

## Documentation

SOON.

## Contributing

### Requirements:

* JavaScript development
    * Node
    * npm
* SASS development
    *  Ruby
    *  Bundler gem

### Setup:
Clone the repo, navigate to the directory, then `npm install` to install dependencies. After the installation is done you can use grunt for development, testing and minification.

    $ grunt -h
    Options marked with * have methods exposed via the grunt API and should instead
    be specified inside the Gruntfile wherever possible.

    Available tasks
            uglify  Minify files with UglifyJS. *
            jshint  Validate files with JSHint. *
             qunit  Run QUnit unit tests in a headless PhantomJS instance. *
             watch  Run predefined tasks whenever watched files change.
            concat  Concatenate files. *
              sass  Compile Sass to CSS *
        nodestatic  Start a static web server. *
            server  Hosts project on port 8080,
                    watches /src files and concats, lints
                    and triggers LiveReload if enabled in your browser.
              test  Run jshint and qunit tests.
             build  Compiles and minifies scss and javascript.
           default  Compiles and minifies javascript

So if you want to run the server to preview changes: `grunt server`, then in a browser go to `http://localhost:8080`.

We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Don't commit files in `dist/`, these are only done on version bumps.
* Package these up in a pull request.

We'll do our best to help you out with any contribution issues you may have.

## Semantic Versioning
This project uses Semantic Versioning for its version numbers.
### Summary

Given a version number MAJOR.MINOR.PATCH, increment the:

1. MAJOR version when you make incompatible API changes,
2. MINOR version when you add functionality in a backwards-compatible manner, and
3. PATCH version when you make backwards-compatible bug fixes.

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

## Version History

* 1.0.0:
    * Uses promises to sync table attachments
    * Is now a bundle of [forked Swipe](https://github.com/Blind238/Swipe), SwipeTable and [when](https://github.com/cujojs/when) (via [browserify](http://browserify.org/))
    * Dynamic header sizing (no longer replaces header with a whole table)
    * Just needs a .swipe-table div in the HTML now (removed children divs)
    * Pinned column size can be adjusted by changing the `st-##` class
    * Tests row heights so you can style the table however you like, it still works!
* 0.0.1: First versioned release.

## License

Copyright © 2013, Jeremy Granadillo. Undecided open source license(MIT, GPL), for now: All rights reserved.  
Swipe Copyright © 2013, Brad Birdsall. MIT License.