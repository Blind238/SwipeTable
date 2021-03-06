# SwipeTable

Mobile oriented AJAX table

## About

A JavaScript library by Jeremy Granadillo.

See the [project homepage](http://blind238.github.io/SwipeTable).

## Installation

<!-- Using Bower:

    bower install SwipeTable

Or -->
Grab the [Javascript file](https://raw.githubusercontent.com/Blind238/SwipeTable/master/dist/SwipeTable.js) ([minified](https://raw.githubusercontent.com/Blind238/SwipeTable/master/dist/SwipeTable.min.js)) and the [CSS file](https://raw.githubusercontent.com/Blind238/SwipeTable/master/dist/swipetable.css)([minified](https://raw.githubusercontent.com/Blind238/SwipeTable/master/dist/swipetable.min.css)).

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


* General
    * node.js
    * grunt 
* JavaScript specific
    * bower
* SASS specific
    *  Ruby
    *  Bundler gem

### Setup:
Make sure you have a recent version of node.js installed.

To install grunt:

    npm install -g grunt


#### Javascript

If you don't already have bower installed:

    npm install -g bower

Clone the repo, navigate to the directory, then `npm install` to install dependencies. Fetch remaining packages with `bower install`. After the installation is done you can use grunt for development, testing and minification.

#### SASS

If you don't already have Bundler installed:

    gem install bundler

Clone the repo, navigate to the directory, then `npm install` to install dependencies. Install SASS with `bundle install` After the installation is done you can use grunt for development, testing and minification.

#### Grunt

    $ grunt -h
    Options marked with * have methods exposed via the grunt API and should instead
    be specified inside the Gruntfile wherever possible.

    Available tasks
            concat  Concatenate files. *
            jshint  Validate files with JSHint. *
            uglify  Minify files with UglifyJS. *
             watch  Run predefined tasks whenever watched files change.
             qunit  Run QUnit unit tests in a headless PhantomJS instance. *
              sass  Compile Sass to CSS *
        browserify  Grunt task for browserify. *
           connect  Start a connect web server. *
      autoprefixer  Parse CSS and add vendor prefixes to CSS rules using values
                    from the Can I Use website. *
            cssmin  Minify CSS files *
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

* 0.0.0:

## License

Copyright © 2013, Jeremy Granadillo. MIT License.  
Uses parts of Swipe: Copyright © 2013, Brad Birdsall. MIT License.