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

var auth = require('basic-auth');
var joi = require('joi');

var DB = require('../lrs-core/db');
var log = require('../lrs-core/logger')('lrs-auth');

/**
 * Verify whether credentials provided through basic auth are valid and enhance
 * the request context with the credential information which contain all the access permissions
 * enabled for the credential account.
 *
 * @param  {Object}         req                         An Express request object that contains the credentials as basic auth
 * @param  {Function}       callback                    Standard callback function
 * @param  {Object}         callback.err                An error that occurred, if any
 */
var verifyAuth = module.exports.verifyAuth = function(req, callback) {
  // Extract the basic authentication credentials
  var credentials = auth(req);

  // Check if the authentication header is present in the request object
  if (!credentials) {
    return callback({code: 401, msg: 'Unauthenticated API request. Check credentials!'});
  }

  // Validate that credentials are present
  var validationSchema = joi.object().keys({
    name: joi.string().required(),
    pass: joi.string().required()
  });

  var validationResult = joi.validate(credentials, validationSchema);

  if (validationResult.error) {
    return callback({code: 401, msg: validationResult.error.details[0].message});
  }

  // Get the credential from the DB
  getCredential(credentials.name, credentials.pass, function(err, credential) {
    if (err) {
      return callback(err);
    }

    // Add the credential information to the request context
    req.ctx = req.ctx || {};
    req.ctx.auth = credential;

    return callback();
  });
};

/**
 * Get a credential based on the credential key and secret.
 * If no credential can be found for these, an invalid authentication
 * attempt will be assumed
 *
 * @param  {String}         key                         The key of the credential to retrieve
 * @param  {String}         secret                      The secret of the credential to retrieve
 * @param  {Function}       callback                    Standard callback function
 * @param  {Object}         callback.err                An error that occurred, if any
 * @param  {Asset}          callback.credential         The requested credential
 * @api private
 */
var getCredential = function(key, secret, callback) {
  // Get the write credentials from the DB
  var options = {
    where: {
      key: key,
      secret: secret
    },
    include: [
      {
        model: DB.Tenant
      }
    ]
  };

  DB.Credential.find(options).complete(function(err, credential) {
    if (err) {
      log.error({err: err}, 'Failed to verify credentials');
      return callback({code: 500, msg: err.message});
    } else if (!credential) {
      log.warn('Incorrect credentials');
      return callback({code: 401, msg: 'Unauthenticated API request. Check credentials!'});
    }

    return callback(null, credential);
  });
};
