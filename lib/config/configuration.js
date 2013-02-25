var mongoose = require('mongoose');
var CronJobSchema = require('../models/CronJob');
var util = require('util');
var fs = require('fs');
var EventEmitter = require("events").EventEmitter;


var Configuration = function(){
  //this.config = JSON.parse(fs.readFileSync('config/configuration.json'));
};

util.inherits(Configuration,EventEmitter);

Configuration.prototype.mongoConfig = function(app){
  mongoose.connect('mongodb://localhost/crontest');
  var db = mongoose.connection;
  var _this = this;

  db.on('error',function(err){
    app.log.error('Error during the configuration of mongodb: %s',err.message);
    _this.emit('error',err);
  });

  db.once('open',function(){
    app.log.trace('Connected to mongo');
    _this.emit('ready',db.model('CronJob',CronJobSchema));
  });
};

exports = module.exports = Configuration;