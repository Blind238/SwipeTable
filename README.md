# SwipeTable

Mobile oriented AJAX table

## About

A JavaScript library by Jeremy Granadillo.

See the [project homepage](http://swipetable.blind238.com).

## Installation

Using Bower:

    bower install SwipeTable

Or grab the [source](https://github.com/blind238/SwipeTable/dist/SwipeTable.js) ([minified](https://github.com/blind238/SwipeTable/dist/SwipeTable.min.js)).

## Usage

Usage is as follows:

Place this HTML snippet where you want the table:

    <div class="swipe-table">
        <div class="st-wrap"></div>
        <div class="st-header"></div>
    </div>

Load the script just before the `</body>` closing tag, then use the following to config and start the table:

    <script>
        (function(root){

            var restApiUrl = '/api';
            var keys = [
                "id", // this is the 'pinned' column
                "time",
                "time2",
                "location",
                "location2"
            ];
            var stElem = document.getElementsByClassName('swipe-table')[0];

            root.SwipeTable = new SwipeTable(restApiUrl, keys, stElem);

        }(this));
    </script>
For advanced usage, see the documentation.

## Documentation

Start with `docs/MAIN.md`.

## Contributing

We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request.

We'll do our best to help you out with any contribution issues you may have.

## License

Copyright © 2013, Jeremy Granadillo. All rights reserved.  
Swipe Copyright © 2013, Brad Birdsall. MIT License.