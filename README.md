Cronos
======
A NodeJS module for handling cron jobs.
It's a wrapper around [node-schedule](https://github.com/mattpat/node-schedule) and it enhances its features by allowing
to automatically keep track of the status of a job and adding a more efficient errors handling mechanic.

Status
------
Alpha as f*ck

PS: the logger level is setted to Trace

Installation
------------
Just clone this repo and launch
   `npm install -d`

Features
-------
* All the features of [node-schedule](https://github.com/mattpat/node-schedule) are present
* Easy to track the jobs that are running (see the how to)
* In case of failure recover all the running job with the `load()` function
* Error handling based on events

General Instructions
--------------------
The main component of this module is the `Scheduler`, that allows to create and schedule job.
A job is created by passing a JSON object 

    job = {
       name:'myJob',
       work:'fileName',
       period:'cronExpression'
    }

`work` is a JavaScript file containing the function that will be executed by the job. It must conform the following structure:

    var execute = function(){
      //body of the function
    };
    exports.execute = execute;

`period` is a cron expression defining when the job must be executed ( actually you can specify the period in all the way
supported by [node-schedule](https://github.com/mattpat/node-schedule) )

Both the `Scheduler` and the `job` objects are event emitter.

The `Scheduler` emits the following event:
* scheduled: A particular `job` is scheduled
* run: A particular `job` has been executed (triggered AFTER the execution of the function)
* stop: A particular `job` has been stopped

The `job` emits the following event:
* error: An error is occurred during the execution of the job function


How-to
-------

### Hello World

First require the module:

    var Scheduler = require('path_to_the_module/scheduler.js'); //to be change as I publish the module on npm
    
Then to create a job:
    
    var scheduler = new Scheduler('path_to_the_script_folder');
    var job = {name:'myJob', work:'work', period:'* * * * *'};
    scheduler.createJobAndSchedule(job,function(cronJob){
      //..do some other stuff
    });
    
Given that `work` is this JavaScript file:

    var execute = function(){
      console.log('Hello World!')
    };
    exports = exports.execute;
    
### Scheduler

This object contains all the method for handling jobs

* `createJob(job,callback)`: create a job but don't schedule it
* `createJobAndSchduler(job,callback)`: create a job and schedule it for execution
* `reSchedule(cronJob)`: re-schedule a job
* `stopJob(cronJob)`: stop a job
* `cancelJob(cronJob)`: terminate a job and cancel it from the database
* `terminateJob(cronJob)`: terminate a job but don't remove it from the database
* `load()`: load all the not terminated jobs saved in the database and schedule them.

All the jobs are contained in the `jobs` array of the `Scheduler` object

### Handling errors

To handle errors simply write a handler for the `error` event of the job

    var scheduler = new Scheduler('path_to_the_script_folder');
    var job = {name:'myJob', work:'work', period:'* * * * *'};
    scheduler.createJobAndSchedule(job,function(cronJob){
      cronJob.on('error',functon(err){
         //handle the error
      });
    });

NOTE: if you schedule the job through the `load` method you have to rewrite the error handler.
    


