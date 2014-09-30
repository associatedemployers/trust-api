/*
 Ticker ( Time Machine ) Default Module
 ---
 Include this module for a single-instantiated ticker with defaults
*/

var defaults = {

};

var Ticker = require('./core'),
    ticker = new Ticker( defaults );

module.exports = ticker;
