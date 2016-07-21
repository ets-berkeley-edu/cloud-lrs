#!/usr/bin/env node

/**
 * Copyright ©2016. The Regents of the University of California (Regents). All Rights Reserved.
 *
 * Permission to use, copy, modify, and distribute this software and its documentation
 * for educational, research, and not-for-profit purposes, without fee and without a
 * signed licensing agreement, is hereby granted, provided that the above copyright
 * notice, this paragraph and the following two paragraphs appear in all copies,
 * modifications, and distributions.
 *
 * Contact The Office of Technology Licensing, UC Berkeley, 2150 Shattuck Avenue,
 * Suite 510, Berkeley, CA 94720-1620, (510) 643-7201, otl@berkeley.edu,
 * http://ipira.berkeley.edu/industry-info for commercial licensing opportunities.
 *
 * IN NO EVENT SHALL REGENTS BE LIABLE TO ANY PARTY FOR DIRECT, INDIRECT, SPECIAL,
 * INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, ARISING OUT OF
 * THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION, EVEN IF REGENTS HAS BEEN ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * REGENTS SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE
 * SOFTWARE AND ACCOMPANYING DOCUMENTATION, IF ANY, PROVIDED HEREUNDER IS PROVIDED
 * "AS IS". REGENTS HAS NO OBLIGATION TO PROVIDE MAINTENANCE, SUPPORT, UPDATES,
 * ENHANCEMENTS, OR MODIFICATIONS.
 */

var config = require('config');
var es = require('event-stream');
var fs = require('fs');
var stream = require('stream');
var tincan = require('tincanjs');
var util = require('util');
var argv = require('yargs')
    .usage('Usage: $0 --key --secret [--number]')
    .demand(['k','s'])
    .alias('k', 'key')
    .describe('k', 'The write credential key to ingest the learning activity statement with')
    .alias('s', 'secret')
    .describe('s', 'The write credential secret to ingest the learning activity statement with')
    .alias('n', 'number')
    .describe('n', 'The number of learning activity statements to ingest')
    .help('h')
    .alias('h', 'help')
    .argv;

// Extract the command line parameters
var number = argv.number;
var key = argv.key;
var secret = argv.secret;

// Configure the statement utility
var tincanStorage = new tincan({
  'recordStores': [{
    'endpoint': util.format('http://localhost:%s/api', config.get('app.port')),
    'username': key,
    'password': secret
  }]
});

// Keep track of how many statements have been ingested
var ingested = 0;

// Read the file with sample statements line by line
var s = fs.createReadStream(__dirname + '/statements.txt')
  .pipe(es.split())
  .pipe(es.mapSync(function(line){

    // Pause the readstream
    s.pause();

    // Parse the line
    var statement = null;
    try {
      statement = JSON.parse(line);
    } catch (err) {
      console.log('Unable to parse a learning activity statement');
      console.log(line);
      return s.resume();
    }

    tincanStorage.sendStatement(statement, function(response, body) {
      var err = null;
      if (response[0].err) {
        console.log('Unable to ingest learning activity statement');
        console.log(response[0].xhr.response);
      }

      ingested++;
      if (ingested % 10 === 0) {
        console.log('Ingested ' + ingested + ' learning activity statements');
      }

      // Resume the readstream if the maximum number of statements hasn't been
      // reached yet
      if (!number || ingested < number) {
        s.resume();
      } else {
        s.end();
      }
    });

  })
  .on('error', function(){
    console.log('Error while reading sample statements');
  })
  .on('end', function(){
    console.log('Finished ingesting sample statements');
  })
);
