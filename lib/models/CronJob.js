var util = require('util');
var mongo = require('mongoose');
var Schema = mongo.Schema;
var EventEmitter = require("events").EventEmitter;

var CronJobSchema = new Schema({

	name:{
		type: String,
		required: true
	},

	work:{
		type:String,
		require: true
	},

	period:{
		type: String,
		require: true
	},

	status:{
		type:String,
		'default':'CREATED',
		'enum':[
			'RUNNING',
			'PAUSED',
			'TERMINATED',
			'CREATED'
		]
	}


});

util.inherits(CronJobSchema,EventEmitter);

exports = module.exports = CronJobSchema;