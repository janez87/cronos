var schedule = require('node-schedule');
var bunyan = require('bunyan');
var domain = require('domain');
var mongoose = require('mongoose');
var _ = require('underscore');
var util = require('util');

var EventEmitter = require("events").EventEmitter;

var Configuration  = require('./config/configuration');
var CronJob = require('./models/CronJob');


var Scheduler = function(path){

	this.jobs = [];
	this.path = path;
	this.init();
};



util.inherits(Scheduler,EventEmitter);

var createJobInstance = function(cronJob,context,domain){

	//creates a 'node-schedule' job object in order to execute the function defined in 'work'
	//the function is passed to the domain using the 'bind' method in order to handle errors within the custom code
	var j = new schedule.Job(cronJob.name,domain.bind(require(context.path+cronJob.work).execute));
	
	j.on('scheduled',function(){
		context.emit('scheduled',cronJob);
	});

	j.on('run',function(){
		context.emit('run',cronJob);
	});

	j.on('canceled',function(){
		domain.dispose();
		context.emit('stop',cronJob);
	});

	return j;
};

//create a job, add it to the context, returns the created job object
Scheduler.prototype.createJob = function(job,callback){
	var log = this.log;
	var cronJob = new this.CronJob(job);
	var _this = this;

	var jobDomain = domain.create();

	var j = createJobInstance(cronJob,this,jobDomain);

	jobDomain.on('error',function(err){
		
		cronJob.emit('error',err);
	});

	cronJob.transientJob = j;

	this.jobs.push(cronJob);
	
	cronJob.save(function(err){
		
		if(err){
			log.error('Error saving the job: %s',err.message);
			throw err;
		}

		log.trace('Saving the job %s',this.name);
		callback(cronJob);
	});

};


//create and schedule a job
Scheduler.prototype.createJobAndSchedule = function(job,callback){
	
	var _this = this;

	this.createJob(job,function(cronJob){
		
		_this.log.trace('Scheduling the job %j',cronJob);
		
		cronJob.transientJob.schedule(cronJob.period);
		cronJob.status = 'RUNNING';
		cronJob.save(function(err){
			if(err){
				_this.log.error('Error saving the job: %s ', e.message);
				throw err;
			}
			
			callback(cronJob);
		});
	});
};

//reschedule an existing job
Scheduler.prototype.reSchedule = function(cronJob){

	var jobDomain = domain.create();

	if(!_.isUndefined(cronJob.transientJob)){
		this.stopJob(cronJob);
	}

	var j = createJobInstance(cronJob,this,jobDomain);

	jobDomain.on('error',function(err){
		cronJob.emit('error',err);
	});

	cronJob.transientJob = j;
	cronJob.transientJob.schedule(cronJob.period);
	cronJob.status = 'RUNNING';
	
};

Scheduler.prototype.stopJob = function(cronJob){

	cronJob.status = 'PAUSED';
	cronJob.transientJob.cancel();

};

//delete the job from the database
Scheduler.prototype.cancelJob = function(cronJob){

	this.stopJob(cronJob);

	var _this = this;

	var index = this.jobs.indexOf(cronJob);
	
	if(index!=-1){
		
		this.jobs.splice(index,1);

		cronJob.remove(function(err){
			if(err){
				throw err;
			}

			_this.emit('deleted',cronJob);
		});
	}

};

//set the job as TERMINATED
//a terminated job will remain in the database but it will not be rescheduled
Scheduler.prototype.terminateJob = function(cronJob){

	this.stopJob(cronJob);

	var _this = this;

	cronJob.update({status:'TERMINATED'},function(err){
		if(err){
			throw err;
		}

		_this.emit('terminated',cronJob);
	});

};

//connect to mongo and load the model
Scheduler.prototype.init = function(){

	this.log = bunyan.createLogger({name:'cronos', level:'trace'});
	var log = this.log;
	
	var _this = this;

	this.configuration = new Configuration();
	this.configuration.on('error',function(err){
		log.error('Error during the configuration of the module');
		throw err;
	});

	this.configuration.once('ready',function(CronJobModel){
		_this.CronJob = CronJobModel;

		log.trace('Module configured and ready for use');
		
		_this.emit('ready');
		
	});

	this.configuration.mongoConfig(this);

};

//load and schedule all the persisted job
Scheduler.prototype.load = function(callback){
	var log = this.log;
	var _this = this;
	this.CronJob.find({},function(err,jobs){
		if(err){
			log.error('Error retrieving the jobs: %s', err.message);
			throw err;
		}
		_.each(jobs,function(j){
			//if the job isn't already loaded
			if(_this.jobs.indexOf(j)==-1 && j.status!='TERMINATED'){
				log.trace('Loading the job %s',j.name);
				_this.jobs.push(j);
				_this.reSchedule(j);
			}
		});

		if( callback ){
			callback(jobs);
		}
	});
};



exports = module.exports = Scheduler;