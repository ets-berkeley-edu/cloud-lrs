
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

var CloudLRS = require('../lrs-core');
var log = require('../lrs-core/logger')('lrs-users');
var UsersAPI = require('./api');

var getUserContext = function(req, callback) {
  var externalId = decodeURIComponent(req.originalUrl.split('/')[3]);
  var tenantId = req.ctx.auth.tenant_id;
  UsersAPI.getUserByExternalId(externalId, tenantId, function(err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback();
    }
    UsersAPI.isStudentOptedOut(user.id, req.ctx.auth.id, function(err, optOutRecord) {
      if (err) {
        return callback(err);
      }
      if (optOutRecord) {
        log.info('Consumer with credential ID ' + req.ctx.auth.id + ' attempted to check opted-out user ID ' + user.id);
      } else {
        // Add the user (if found) to the request context object
        req.ctx = req.ctx || {};
        req.ctx.user = user;
      }
      return callback();
    });
  });
};

var getOrCreateUserContext = function(req, callback) {
  var externalId = decodeURIComponent(req.originalUrl.split('/')[3]);
  var tenantId = req.ctx.auth.tenant_id;
  UsersAPI.getOrCreateUser(externalId, tenantId, null, function(err, user) {
    if (err) {
      return callback(err);
    }

    // Add the user (if found) to the request context object
    req.ctx = req.ctx || {};
    req.ctx.user = user;

    return callback();
  });
};

/* !
 * Get the most recent learning activity statements for the requested user
 */
CloudLRS.apiRouter.get('/user/:userId/recentactivities', function(req, res) {
  // Check if the credentials authenticated has sufficient read permissions
  if (!req.ctx.auth.read_permission) {
    return res.status(403).send('Incorrect read credentials');
  }

  getUserContext(req, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }
    if (!req.ctx.user) {
      return res.status(200).send({
        total: 0,
        results: []
      });
    }

    UsersAPI.getUserStatements(req.ctx, req.query.limit, req.query.offset, function(err, activities) {
      if (err) {
        return res.status(err.code).send(err.msg);
      }

      return res.status(200).send(activities);
    });
  });
});

/* !
 * Get the total number of learning activities per month for the requested user
 */
CloudLRS.apiRouter.get('/user/:userId/totalactivities', function(req, res) {
  // Check if the credentials authenticated has sufficient read permissions
  if (!req.ctx.auth.read_permission) {
    return res.status(403).send('Incorrect read credentials');
  }

  getUserContext(req, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }
    if (!req.ctx.user) {
      return res.status(200).send([]);
    }

    UsersAPI.getTotalActivities(req.ctx, function(err, totalActivities) {
      if (err) {
        return res.status(err.code).send(err.msg);
      }

      return res.status(200).send(totalActivities);
    });
  });
});

/* !
 * Get the most frequent learning activities for the requested user
 */
CloudLRS.apiRouter.get('/user/:userId/topactivities', function(req, res) {
  // Check if the credentials authenticated has sufficient read permissions
  if (!req.ctx.auth.read_permission) {
    return res.status(403).send('Incorrect read credentials');
  }

  getUserContext(req, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }
    if (!req.ctx.user) {
      return res.status(200).send([]);
    }

    UsersAPI.getTopActivities(req.ctx, function(err, topActivities) {
      if (err) {
        return res.status(err.code).send(err.msg);
      }

      return res.status(200).send(topActivities);
    });
  });
});

/* !
 * Get the data sources that have generated learning activities for the requested user
 */
CloudLRS.apiRouter.get('/user/:userId/datasources', function(req, res) {
  // Check if the credentials authenticated has sufficient read permissions
  if (!req.ctx.auth.read_permission) {
    return res.status(403).send('Incorrect read credentials');
  }

  getUserContext(req, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }
    if (!req.ctx.user) {
      return res.status(200).send([]);
    }
    UsersAPI.getDataSources(req.ctx, function(err, dataSources) {
      if (err) {
        return res.status(err.code).send(err.msg);
      }

      return res.status(200).send(dataSources);
    });
  });
});

/* !
 * Get the different projects that potentially have access to the requested user's data
 */
CloudLRS.apiRouter.get('/user/:userId/datauses', function(req, res) {
  // Check if the credentials authenticated has sufficient read permissions
  if (!req.ctx.auth.read_permission) {
    return res.status(403).send('Incorrect read credentials');
  }

  getUserContext(req, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    UsersAPI.getDataUses(req.ctx, function(err, dataUses) {
      if (err) {
        return res.status(err.code).send(err.msg);
      }

      return res.status(200).send(dataUses);
    });
  });
});


/* !
 * Process user's data share opt-in/opt-out update request for different projects.
 */
CloudLRS.apiRouter.post('/user/:userId/datashare', function(req, res) {
  // Check if the credentials authenticated has sufficient read permissions
  if (!req.ctx.auth.write_permission) {
    return res.status(403).send('Incorrect write credentials');
  }

  getOrCreateUserContext(req, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    // Process the user's data share opt-in/opt-out request
    UsersAPI.saveUserOptOut(req.ctx, req.body, function(err) {
      if (err) {
        return res.status(err.code).send(err.msg);
      }

      return res.sendStatus(200);
    });
  });
});

/* !
 * Get a requested user details
 */
CloudLRS.apiRouter.get('/user/:userId', function(req, res) {
  // Check if the credentials authenticated has sufficient read permissions
  if (!req.ctx.auth.read_permission) {
    return res.status(403).send('Incorrect read credentials');
  }

  getUserContext(req, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }
    if (!req.ctx.user) {
      return res.status(404).send('Could not find a user');
    }

    return res.status(200).send(req.ctx.user);

  });

});
