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

var _ = require('lodash');

var AuthAPI = require('../lrs-auth/api');
var CloudLRS = require('../lrs-core');
var StatementXAPI = require('./xapi');
var StatementCaliper = require('./caliper');
var log = require('../lrs-core/logger')('lrs-statements');

const CALIPER = 'CALIPER';
const XAPI = 'XAPI';

/*!
 * Store a new learning activity statement
 */
var processStatement = function(req, res) {
  // Verify write credentials
  AuthAPI.verifyWriteAuth(req, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    // Determine if statement is of type XAPI or Caliper.
    getStatementType(req.body, function(err, statementType) {
      if (err) {
        log.error({'err': err}, 'Statement not in xAPI or Caliper format');
        return res.status(err.code).send(err.msg);
      }

      // Process and save XAPI and Caliper statements appropriately.
      switch (statementType) {
        case 'XAPI':
        StatementXAPI.saveStatement(req.ctx, req.body, function(err, statement) {
          if (err) {
            return res.status(err.code).send(err.msg);
          }

          log.info('XAPI statement processing successful with uuid : ' + statement.uuid);
          return res.sendStatus(201);
        });
        break;

        case 'CALIPER':
        StatementCaliper.saveStatement(req.ctx, req.body, function(err, statement) {
          if (err) {
            return res.status(err.code).send(err.msg);
          }

          log.info('Caliper statement processing successful with uuid: ' + statement.uuid);
          return res.sendStatus(201);
        });
        break;
      }

    });
  });
};

/**
 * Check and extract the statement type from the request to be processed.
 *
 * @param  {Object}           statement                   The learning activity statement to be validated for statement type
 * @param  {Object}           callback.err                An error that occurred, if any
 * @param  {String}           callback.statementType      The statement type identified
 */
var getStatementType = function(statement, callback) {
  var statementType = '';
  if (statement.hasOwnProperty('uuid') && statement.hasOwnProperty('@context') && statement.hasOwnProperty('eventTime') && statement.hasOwnProperty('actor') && statement.hasOwnProperty('object') && statement.hasOwnProperty('object')) {
    statementType = CALIPER;
    log.info('Statement is in caliper format');
  } else if (statement.hasOwnProperty('id') && statement.hasOwnProperty('actor') && statement.hasOwnProperty('verb') && statement.hasOwnProperty('object') && statement.hasOwnProperty('timestamp')) {
    statementType = XAPI;
    log.info('Statement is in xAPI format');
  } else {
    log.error('Statement not in xAPI or Caliper format');
    return callback({'code': '400', 'msg':'Statement not in xAPI or Caliper format'});
  }

  return callback(null, statementType);
};

CloudLRS.apiRouter.post('/statements', processStatement);
CloudLRS.apiRouter.put('/statements', processStatement);
