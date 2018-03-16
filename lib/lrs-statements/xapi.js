/**
 * Copyright ©2018. The Regents of the University of California (Regents). All Rights Reserved.
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

var Joi = require('joi');
var uuid = require('uuid');
var xapiValidator = require('xapi-validator');

var DB = require('../lrs-core/db');
var log = require('../lrs-core/logger')('lrs-statements');

const XAPI = 'XAPI';
const XAPI_VERSION = '1.0.2';

/**
 * Get a learning activity statement by its uuid
 *
 * @param  {String}           id                    The uuid by which to retrieve the learning activity statement
 * @param  {Function}         callback              Standard callback function
 * @param  {Object}           callback.err          An error that occurred, if any
 * @param  {Statement}        callback.statement    The requested learning activity statement
 */
var getStatement = module.exports.getStatement = function(id, callback) {
  // Parameter validation
  var validationSchema = Joi.object().keys({
    id: Joi.string().required()
  });

  var validationResult = Joi.validate({
    id: id
  }, validationSchema);

  if (validationResult.error) {
    return callback({code: 400, msg: validationResult.error.details[0].message});
  }

  DB.Statement.findById(id).complete(function(err, statement) {
    if (err) {
      log.error({err: err, id: id}, 'An error occurred when getting a learning activity statement');
      return callback({code: 500, msg: err.message});
    } else if (!statement) {
      return callback({code: 404, msg: 'Could not find a learning activity statement'});
    }

    return callback(null, statement);
  });
};

/**
 * Validate and save a learning activity statement
 *
 * @param  {Object}           ctx                       Context containing write credentials
 * @param  {Object}           statement                 The learning activity statement to save
 * @param  {Function}         callback                  Standard callback function
 * @param  {Object}           callback.err              An error that occurred, if any
 */
var saveStatement = module.exports.saveStatement = function(ctx, statement, callback) {
  if (!ctx || !ctx.auth) {
    log.warn('Prevented storing a learning activity without authentication');
    return callback({code: 500, msg: 'Prevented storing a learning activity without authentication'});
  }

  // Verify that no other learning activity statement with the same uuid already exists
  getStatement(statement.id, function(err, retrievedStatement) {
    if (retrievedStatement) {
      log.warn({id: statement.id}, 'Attempted to save a learning activity statement that already exists');
      return callback({code: 400, msg: 'Attempted to save a learning activity statement that already exists'});
    } else if (err && err.code !== 404) {
      log.error({id: statement.id}, 'Unable to verify if learning activity statement already exists');
      return callback(err);
    }

    // Validate the xAPI statement
    xapiValidator.validate(statement, function(err) {
      if (err) {
        log.warn({err: err}, 'Invalid learning activity statement');
        return callback({code: 500, msg: err});
      }

      // When no uuid has been included, generate one
      statement.id = statement.id || uuid.v4();

      var currentTimestamp = new Date().toISOString();

      // When no timestamp has been included, generate one
      statement.timestamp = statement.timestamp || currentTimestamp;

      // Add the stored timestamp
      statement.stored = currentTimestamp;

      // Set statement type and version. Currently all XAPI feeds are coming from in house apps running 1.0.2 version.
      // TODO: For future integrations these variables can be derived to accomodate different versions. Currently, setting it to default.
      var statementType = XAPI;
      var statementVersion = XAPI_VERSION;
      var voided = false;

      // Get the learning activity statement that's referenced in the current
      // learning activity statement, if any
      getStatementRef(statement, function(err, refStatement) {
        if (err) {
          log.error({err: err}, 'An error occured while getting the referenced learning activity statement');
          return callback(err);
        }

        // Create the activity type summary (verb_objecttype)
        var activityType = statement.verb.id.split('/').pop();
        if (statement.object && statement.object.definition && statement.object.definition.type) {
          activityType += '_' + statement.object.definition.type.split('/').pop();
        } else if (refStatement && refStatement.object && refStatement.object.definition && refStatement.object.definition.type) {
          activityType += '_' + refStatement.object.definition.type.split('/').pop();
        }
        activityType = activityType.toLowerCase();

        // Get the user associated to this learning activity. If the user
        // doesn't exist yet, it will be created
        getOrCreateUser(ctx, statement, function(err, user) {
          if (err) {
            log.error({err: err}, 'An error occured while getting the learning activity statement actor');
            return callback(err);
          }

          var actorType = null;
          if (user) {
            actorType = 'Person';
          }

          // Store the learning activity statement in the DB
          var storedStatement = {
            uuid: statement.id,
            statement: statement,
            verb: statement.verb.id,
            timestamp: statement.timestamp,
            activity_type: activityType,
            voided: voided,
            tenant_id: ctx.auth.tenant_id,
            user_id: user.id,
            actor_type: actorType,
            statement_type: statementType,
            statement_version: statementVersion,
            credential_id: ctx.auth.id
          };

          DB.Statement.create(storedStatement).complete(function(err, statement) {
            if (err) {
              log.error({err: err}, 'Failed to store a new learning activity statement');
              return callback({code: 500, msg: err.message});
            }

            log.debug({statement: statement}, 'Sucessfully stored learning activity statement');
            return callback(null, statement);
          });
        });
      });
    });
  });
};

/**
 * Get a learning activity statement that's referenced in a different learning
 * activity statement's object, if any
 *
 * @param  {Object}           statement                 The learning activity statement to check for referenced learning activities
 * @param  {Function}         callback                  Standard callback function
 * @param  {Object}           callback.err              An error that occurred, if any
 * @param  {Statement}        callback.refStatement     The learning activity statement referenced in the provided learning activity statement
 * @api private
 */
var getStatementRef = function(statement, callback) {
  // The statement doesn't contain a statement reference
  if (!statement.object || !(statement.object.objectType === 'StatementRef' && statement.object.id)) {
    return callback();
  }

  getStatement(statement.object.id, function(err, refStatement) {
    if (err && err.code !== 404) {
      log.info({id: id}, 'Could not find a referenced learning activity statement');
      return callback(err);
    }

    return callback(null, refStatement);
  });
};

/**
 * Retrieve the user that corresponds to the actor on a learning activity statement.
 * If the user doesn't exist, it will be created.
 *
 * @param  {Object}           ctx                       Context containing write credentials
 * @param  {Object}           statement                 The learning activity statement to extract the actor from
 * @param  {Function}         callback                  Standard callback function
 * @param  {Object}           callback.err              An error that occurred, if any
 * @param  {Object}           callback.user             The requested user, or the generated user if the user didn't exist
 * @api private
 */
var getOrCreateUser = function(ctx, statement, callback) {
  // Extract the user's name
  var name = null;
  var external_id = null;

  if (statement.actor.name) {
    name = statement.actor.name;
  } else if (statement.actor.account && statement.actor.account.name) {
    name = statement.actor.account.name;
  }

  // Extract the user's external id
  if (statement.actor.mbox) {
    external_id = statement.actor.mbox;
  } else if (statement.actor.account && statement.actor.account.name) {
    external_id = statement.actor.account.name;
  }

  if (!external_id) {
    log.error({statement: statement}, 'Unable to extract user from statement');
    return callback({code: 500, msg: 'Unable to extract user from statement'});
  }

  // Get the user from the DB or create it if it doesn't exist yet
  options = {
    where: {
      tenant_id: ctx.auth.tenant_id,
      external_id: external_id
    },
    defaults: {
      tenant_id: ctx.auth.tenant_id,
      external_id: external_id,
      name: name
    }
  };

  DB.User.findOrCreate(options).complete(function(err, data) {
    if (err) {
      log.error({err: err}, 'Failed to get or create a user');
      return callback({code: 500, msg: err.message});
    }

    var user = data[0];
    return callback(null, user);
  });
};
