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
var auth = require('basic-auth');
var joi = require('joi');

var DB = require('../lrs-core/db');
var log = require('../lrs-core/logger')('lrs-auth');

/**
 * Verify whether write credentials provided through basic auth are valid and enhance
 * the request context with the write credential information
 *
 * @param  {Object}         req                         An Express request object that contains the write credentials as basic auth
 * @param  {Function}       callback                    Standard callback function
 * @param  {Object}         callback.err                An error that occurred, if any
 */
var verifyWriteAuth = module.exports.verifyWriteAuth = function(req, callback) {
  // Extract the basic authentication credentials
  var credentials = auth(req);

  // Validate that credentials are present
  var validationSchema = joi.object().keys({
    'name': joi.string().required(),
    'pass': joi.string().required()
  });

  var validationResult = joi.validate(credentials, validationSchema);

  if (validationResult.error) {
    return callback({'code': 400, 'msg': validationResult.error.details[0].message});
  }

  // Get the write credential from the DB
  getWriteCredential(credentials.name, credentials.pass, function(err, writeCredential) {
    if (err) {
      return callback();
    }

    // Add the write credential to the request context
    req.ctx = req.ctx || {};
    req.ctx.auth = writeCredential;

    return callback();
  });
};

/**
 * Get a write credential based on the write credential key and secret.
 * If no write credential can be found for these, an invalid authentication
 * attempt will be assumed
 *
 * @param  {String}         key                         The key of the write credential to retrieve
 * @param  {String}         secret                      The secret of the write credential to retrieve
 * @param  {Function}       callback                    Standard callback function
 * @param  {Object}         callback.err                An error that occurred, if any
 * @param  {Asset}          callback.writeCredential    The requested write credential
 * @api private
 */
var getWriteCredential = function(key, secret, callback) {
  // Get the write credentials from the DB
  var options = {
    'where': {
      'key': key,
      'secret': secret
    },
    'include': [
      {
        'model': DB.Tenant
      }
    ]
  };

  DB.WriteCredential.find(options).complete(function(err, writeCredential) {
    if (err) {
      log.error({'err': err}, 'Failed to verify write credentials');
      return callback({'code': 500, 'msg': err.message});
    } else if (!writeCredential) {
      log.warn({'err': err}, 'Incorrect write credentials');
      return callback({'code': 401, 'msg': 'Incorrect write credentials'});
    }

    return callback(null, writeCredential);
  });
};

/**
 * Verify whether read credentials provided through basic auth are valid and enhance
 * the request context with the read credential information
 *
 * @param  {Object}         req                         An Express request object that contains the read credentials as basic auth
 * @param  {Function}       callback                    Standard callback function
 * @param  {Object}         callback.err                An error that occurred, if any
 */
var verifyReadAuth = module.exports.verifyReadAuth = function(req, callback) {
  // Extract the basic authentication credentials
  var credentials = auth(req);

  // Validate that credentials are present
  var validationSchema = joi.object().keys({
    'name': joi.string().required(),
    'pass': joi.string().required()
  });

  var validationResult = joi.validate(credentials, validationSchema);

  if (validationResult.error) {
    return callback({'code': 400, 'msg': validationResult.error.details[0].message});
  }

  // Get the read credential from the DB
  getReadCredentials(credentials.name, credentials.pass, function(err, readCredential) {
    if (err) {
      return callback();
    }

    // Add the read credential to the request context
    req.ctx = req.ctx || {};
    req.ctx.auth = readCredential;

    return callback();
  });
};

/**
 * Get a read credential based on the read credential key and secret.
 * If no read credential can be found for these, an invalid authentication
 * attempt will be assumed
 *
 * @param  {String}         key                         The key of the read credential to retrieve
 * @param  {String}         secret                      The secret of the read credential to retrieve
 * @param  {Function}       callback                    Standard callback function
 * @param  {Object}         callback.err                An error that occurred, if any
 * @param  {Asset}          callback.readCredential     The requested read credential
 * @api private
 */
var getReadCredentials = function(key, secret, callback) {
  // Get the read credentials from the DB
  var options = {
    'where': {
      'key': key,
      'secret': secret
    },
    'include': [
      {
        'model': DB.Tenant
      }
    ]
  };

  DB.ReadCredential.find(options).complete(function(err, readCredential) {
    if (err) {
      log.error({'err': err}, 'Failed to verify read credentials');
      return callback({'code': 500, 'msg': err.message});
    } else if (!readCredential) {
      log.warn({'err': err}, 'Incorrect read credentials');
      return callback({'code': 401, 'msg': 'Incorrect read credentials'});
    }

    return callback(null, readCredential);
  });
};
