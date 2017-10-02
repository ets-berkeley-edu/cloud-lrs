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
var Sequelize = require('sequelize');

var log = require('./logger')('lrs-core/db');

// A sequelize instance that will be connected to the database
var sequelize = null;

/**
 * Initialize the database and the Learning Record Store models
 *
 * @param  {Function}       callback            Standard callback function
 * @param  {Object}         callback.err        An error object, if any
 */
var init = module.exports.init = function(callback) {
  var sequelizeConfig = {
    host: config.get('db.host'),
    port: config.get('db.port'),
    dialect: 'postgres',
    dialectOptions: {
      ssl: config.get('db.ssl')
    },
    databaseVersion: config.get('db.version'),
    logging: function(msg) {
      log.trace(msg);
    }
  };

  // Set up a connection to the database
  sequelize = new Sequelize(config.get('db.database'), config.get('db.username'), config.get('db.password'), sequelizeConfig);

  sequelize.authenticate().complete(function(err) {
    if (err) {
      log.error({err: err}, 'Unable to set up a connection to the database');
      return callback({code: 500, msg: 'Unable to set up a connection to the database'});
    }

    log.debug('Connected to the database');

    // Set up the model
    setUpModel(sequelize);

    // Synchronize the Learning Record Store models with the database
    return sync(callback);
  });
};

/**
 * Synchronize the Learning Record Store models with the database
 *
 * @param  {Function}       callback            Standard callback function
 * @param  {Object}         callback.err        An error object, if any
 */
var sync = function(callback) {
  // Allow model synchronization to be skipped. This is useful in production so a user without
  // table modification rights can be configured
  if (config.get('db.sync') === false) {
    log.debug('Skipping DB synchronization');
    return callback();
  }

  // By setting `force` to `true` we will drop each table and recreate it. This is useful
  // during development/testing when models tend to change. This is NEVER done in production
  var force = false;
  if (process.env.NODE_ENV !== 'production' && config.get('db.dropOnStartup') === true) {
    force = true;
  }

  sequelize.sync({force: force}).complete(function(err) {
    if (err) {
      log.error({err: err}, 'Unable to sync the model to the database');
      return callback({code: 500, msg: 'Unable to sync the model to the database'});
    }

    log.debug('Synced model to database');

    return callback();
  });
};

/**
 * Get the `Sequelize` object
 *
 * @return {Sequelize}                                A sequelize instance that is connected to the database
 */
var getSequelize = module.exports.getSequelize = function() {
  return sequelize;
};

/**
 * Set up the DB model
 *
 * @param  {Sequelize}        sequelize               A sequelize instance that is connected to the database
 * @api private
 */
var setUpModel = function(sequelize) {

  /**
   * The `tenants` table tracks the top-level integrated environments which have data in the Learning Record Store.
   * A tenant incorporates a set of users, data sources, data consumers, and learning record statements.
   * Examples: "UC Berkeley", "Stanford", "UCB Test Data".
   *
   * @property  {String}      name         The name identifying the tenant
   */
  var Tenant = module.exports.Tenant = sequelize.define('tenant', {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    underscored: true
  });

  /**
   * TODO We will want some sort of data-source-specific (i.e., Credential-specific) "Course" or "Context"
   * table, used as a foreign key in the Statements table, to let clients fetch wider results for a particular
   * set of related LRS events rather than being restricted to individual students. (E.g., "all discussion
   * events for this Canvas website" or "all final grades for this this campus class".)
   *
   * Note that the context type of an LRS Statement varies by event data source, and may not be in an 1-to-1
   * relationship with the contexts of other event data sources. In particular, at UC Berkeley a bCourses
   * website does not reliably map to a single SIS-defined class section or class-with-multiple-sections, and
   * a course offering for a given academic term may map to multiple class sections, some of which are graded
   * independently.
   */

  /**
   * The `users` table keeps track of each user for which a learning activity has been received or an Opt-Out
   * request has been made.
   *
   * @property  {String}       name               Name as initially specified in the Learning Statement (may not match
   *                                              legal or preferred name)
   * @property  {String}       external_id        The unique external ID of the user within the tenant
   * @property  {Foreign key}  tenant_id          The tenant associated with this user's data
   */
  var User = module.exports.User = sequelize.define('user', {
    name: {
      type: Sequelize.STRING,
      allowNull: true
    },
    external_id: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    underscored: true
  });

  // Each user belongs to a tenant
  User.belongsTo(Tenant, {
    onDelete: 'CASCADE',
    foreignKey: {
      name: 'tenant_id',
      allowNull: false
    }
  });

  /**
   * The `credentials` table identifies and authorizes software integrations which produce or consume Learning Record
   * Store data. Consumers such as research projects will set the `datashare` flag as well as `read_permission` to
   * gain access to any data source associated with the Tenant (except as denied by user opt-outs).
   *
   * @property  {String}       name                    The name of the external application or research project
   * @property  {String}       [description]           The description of the project
   * @property  {String}       key                     The key used for authentication
   * @property  {String}       secret                  The secret used for authentication
   * @property  {Boolean}      read_permission         Whether the client has access to read learning activities from LRS
   * @property  {Boolean}      write_permission        Whether the client has access to write learning activities to LRS
   * @property  {Boolean}      datashare               Whether read permissions apply across the Tenant unless vetoed by Opt-Outs
   * @property  {Boolean}      anonymous               Whether the client only has access to anonymized learning activities
   * @property  {Foreign key}  tenant_id               The tenant associated with this client
   */
  var Credential = module.exports.Credential = sequelize.define('credential', {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    key: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    secret: {
      type: Sequelize.STRING,
      allowNull: false
    },
    anonymous: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    read_permission: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    write_permission: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    datashare: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    underscored: true
  });

  // Every credential belongs to a tenant
  Credential.belongsTo(Tenant, {
    onDelete: 'CASCADE',
    foreignKey: {
      name: 'tenant_id',
      allowNull: false
    }
  });

  /**
   * The `opt_out` table keeps track of students who have opted_out of the data use for Learning analytics projects
   *
   * @property  {Foreign key}      user_id                    The user ID
   * @property  {Foreign key}      credential_id              The credential ID for the project using learning data
   */
  var Opt_out = module.exports.Opt_out = sequelize.define('opt_out', {

  });

  // A user can opt out of multiple credentials and a credential
  // can be opted out of by multiple users
  Credential.belongsToMany(User, {through: 'opt_out'});
  User.belongsToMany(Credential, {through: 'opt_out'});

  /**
   * The `statements` table keeps track of all learning activities
   *
   * @property  {String}       uuid                    The unique UUID of the learning activity statement
   * @property  {Object}       statement               The raw learning activity statement object
   * @property  {String}       verb                    The verb of the learning activity
   * @property  {Date}         timestamp               The time at which the learning activity took place
   * @property  {String}       activity_type           An aggregated learning activity type containing the verb and object type (e.g., read_page)
   * @property  {String}       actor_type              If the actor agent was a Person, Software App, etc.
   * @property  {String}       statement_type          If the statement is in XAPI or CALIPER format
   * @property  {String}       statement_version       Version of the statement
   * @property  {Boolean}      voided                  Whether the learning activity statement has been voided
   * @property  {Foreign key}  tenant_id               The tenant which provides the context of this statement
   * @property  {Foreign key}  user_id                 The user referred to by the statement, if any
   * @property  {Foreign key}  credential_id           The credential of the client which stored this statement
   */
  var Statement = module.exports.Statement = sequelize.define('statement', {
    uuid: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    },
    statement: {
      type: Sequelize.JSON,
      allowNull: false
    },
    verb: {
      type: Sequelize.STRING,
      allowNull: false
    },
    timestamp: {
      type: Sequelize.DATE,
      allowNull: false
    },
    activity_type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    actor_type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    statement_type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    statement_version: {
      type: Sequelize.STRING,
      allowNull: false
    },
    voided: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  }, {
    underscored: true
  });

  // Every statement will be associated with a tenant.
  Statement.belongsTo(Tenant, {
    onDelete: 'CASCADE',
    foreignKey: {
      name: 'tenant_id',
      allowNull: false
    }
  });

  // Most statements will be associated with a user, although some statements may be generated by software applications
  // or other entities.
  Statement.belongsTo(User, {
    onDelete: 'CASCADE',
    foreignKey: {
      name: 'user_id',
      allowNull: true
    }
  });

  // A statement will have been stored by a client whose credential has write permission.
  Statement.belongsTo(Credential, {
    onDelete: 'CASCADE',
    foreignKey: {
      name: 'credential_id',
      allowNull: false
    }
  });

};
