Cronos
======
A NodeJS module for handling cron jobs.
It's a wrapper around [node-schedule](https://github.com/mattpat/node-schedule) and it enhances its features by allowing
to automatically keep track of the status of a job and adding a more efficient errors handling mechanic.

Status
------
Alpha as f*ck

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

How-to
-------
  
