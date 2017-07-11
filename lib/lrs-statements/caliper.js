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
var Joi = require('joi');
var uuid = require('uuid');
var config = require('config');
var bigInt = require('big-integer');

var DB = require('../lrs-core/db');
var log = require('../lrs-core/logger')('lrs-statements');
// TODO Caliper packaging is still a work in progress. This module will need to be installed
// manually and the path may need to be changed.
var caliperValidator = require('caliperjs/src/validators/validator');

const CALIPER = 'CALIPER';
const CALIPER_VERSION = 'v1p1';

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
    'id': Joi.string().required()
  });

  var validationResult = Joi.validate({
    'id': id
  }, validationSchema);

  if (validationResult.error) {
    return callback({'code': 400, 'msg': validationResult.error.details[0].message});
  }

  DB.Statement.findById(id).complete(function(err, statement) {
    if (err) {
      log.error({'err': err, 'id': id}, 'An error occurred when getting a learning activity statement');
      return callback({'code': 500, 'msg': err.message});
    } else if (!statement) {
      return callback({'code': 404, 'msg': 'Could not find a learning activity statement'});
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
    return callback({'code': 500, 'msg': 'Prevented storing a learning activity without authentication'});
  }

  validateStatement(statement, function(err, statement) {
    if (err) {
      log.error("The caliper statement had validation errors");
      return callback({'code': err.code, 'msg': err.msg});
    }

    var uuid = statement.id.split(':').pop();

    getStatement(uuid, function(err, retrievedStatement) {
      if (retrievedStatement) {
        log.error({'id': uuid}, 'Attempted to save a learning activity statement that already exists');
        return callback({'code': 400, 'msg': 'Attempted to save a learning activity statement that already exists'});
      } else if (err && err.code !== 404) {
        log.error({'id': uuid}, 'Unable to verify if learning activity statement already exists');
        return callback(err);
      }

      var currentTimestamp = new Date().toISOString();

      // When no timestamp has been included, generate one
      statement.timestamp = statement.eventTime || currentTimestamp;

      // Derive statement type and version from context
      var statementType = CALIPER;
      var statementVersion = statement["@context"].split('/').pop() || CALIPER_VERSION;

      // Setting voided to false by default. Change the flag as necessary
      var voided = false;

      // Get the user associated to this learning activity. If the user
      // doesn't exist yet, it will be created
      getOrCreateUser(ctx, statement, function(err, user) {
        if (err) {
          log.error({'err': err}, 'An error occured while getting the learning activity statement actor');
          return callback(err);
        }

        // Store the learning activity statement in the DB
        var storedStatement = {
          'uuid': uuid,
          'statement': statement,
          'verb': statement.type.toString(),
          'timestamp': statement.eventTime,
          'activity_type': statement.action.toString(),
          'voided': voided,
          'tenant_id': ctx.auth.tenant_id,
          'user_id': user.id,
          'actor_type': statement.actor.type.toString(),
          'statement_type': statementType,
          'statement_version': statementVersion,
          'write_credential_id': ctx.auth.id
        };

        DB.Statement.create(storedStatement).complete(function(err, statement) {
          if (err) {
            log.error({'err': err}, 'Failed to store a new learning activity statement');
            return callback({'code': 500, 'msg': err.message});
          }

          log.info({'statementId': statement.uuid}, 'Successfully stored learning activity statement');
          return callback(null, statement);
        });
      });
    });

  });
}

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
  // Extract the user's external id & name if available from the actor object
  // TODO : RegEx is tailored for UCB requirements. Revisit JSON parser to make it generic
  var name = null;
  var external_id = null;

  // TODO : Add support for other actor types like Organizations based on examples from Caliper spec.
  if (statement.actor.hasOwnProperty('type') && statement.actor.hasOwnProperty('id') && statement.actor.type === 'Person') {

    if(statement.actor.hasOwnProperty('extensions')) {
      external_id = statement.actor.extensions[0].user_login;
    }

  } else if (statement.actor.hasOwnProperty('type') && statement.actor.type === 'SoftwareApplication') {
    try {
      if (statement.object.actor.hasOwnProperty('id') && statement.object.actor.hasOwnProperty('type') && statement.object.actor.type === 'Person') {

        if (statement.object.actor.hasOwnProperty('extensions')) {
          external_id = statement.object.actor.extensions[0].user_login;
        }

      }
    } catch (err) {
      external_id = null;
    }
  }

  // TODO: SOme events(Outcome Events) with Software application as actors does not have
  // extensions field from which user login Id can be derived. Such statements are not accepted.
  // This is a bug in Instructures stream. Expect some modifications to the function. 

  if (!external_id) {
    log.error({'statement': statement}, 'Unable to extract user from statement');
    return callback({'code': 500, 'msg': 'Unable to extract user from statement'});
  }

  var profileInfo = {
    'external_id': external_id
  };

  // Get the user from the DB or create it if it doesn't exist yet
  options = {
    'where': {
      'tenant_id': ctx.auth.tenant_id,
      'external_id': external_id,
    },
    'defaults': {
      'tenant_id': ctx.auth.tenant_id,
      'external_id': external_id,
      'name': name,
    }
  };

  DB.User.findOrCreate(options).complete(function(err, data) {
    if (err) {
      log.error({'err': err}, 'Failed to get or create a user');
      return callback({'code': 500, 'msg': err.message});
    }

    var user = data[0];
    var wasCreated = data[1];

    if (wasCreated) {
      log.info({'id': user.id}, 'Created a new user');
      return callback(null, user);

      // If the user already exists, we update its profile values with the
      // values supplied by Canvas
    } else {
      user.updateAttributes(profileInfo).complete(function(err, user) {
        if (err) {
          log.error({'err': err}, 'Failed to update a user');
          return callback({'code': 500, 'msg': err.message});
        }

        return callback(null, user);
      });
    }
  });
};

/**
* Check required Event properties against set of user-supplied values
* @param  {Object}           statement                 Caliper event to be validated
* @param  {Object}           callback.err              An error that occurred, if any
* @param  {Object}           callback.statement        The statement that passed validation
*/
var validateStatement = module.exports.validateStatement = function(statement, callback) {
  var validationError = null;
  Object.keys(statement).forEach(function(key) {
    switch (key) {
      case "@context":
      if (!caliperValidator.hasCaliperContext(statement)) {
        validationError = validationError + "\nRequired context not provided.";
      }
      break;
      case "type":
      if (!caliperValidator.hasType(statement)) {
        validationError = validationError + "\nRequired type not provided.";
      }
      break;
      case "id":
      if (!caliperValidator.hasUuidUrn(statement)) {
        validationError = validationError + "\nUUID URN is missing.";

        // TODO: Normally if uuid id not present or wrong we generate one for statement consumption
        // IMS Caliper Working group mentioned there will be changes to the uuid spec in coming days.
        // statement.uuid = uuid.v4();
        // console.log("UUID provided is not valid. Replacing it with a proper uuid.");
      }
      break;
      case "actor":
      if (!caliperValidator.hasActor(statement)) {
        validationError = validationError + "\nRequired actor not provided.";
      }
      break;
      case "action":
      if (!caliperValidator.hasAction(statement)) {
        validationError = validationError + "\nRequired action not provided.";
      }
      break;
      case "object":
      if (!caliperValidator.hasObject(statement)) {
        validationError = validationError + "\nRequired object not provided.";
      }
      break;
      case "eventTime":
      if (!caliperValidator.hasEventTime(statement)) {
        validationError = validationError + "\nRequired ISO 8601 formatted eventTime not provided.";
      }
      break;
    }
  });

  if (validationError) {
    log.error("Validation errors found in Caliper statement");
    return callback({'code': 400, 'msg': validationError});
  } else {
    log.info("Caliper statement passed basic validation");
    return callback(null, statement);
  }
};
