var when = require('when');
var attachFastClick = require('fastclick');
//TODO: Find a better way to require bouncefix
var bouncefix = require('./../../bower_components/bouncefix.js/lib/bouncefix.js');

module.exports = function(dataProviderUrl, tableKeys, elem, options){
  'use strict';
