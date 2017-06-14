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

var CloudLRS = require('../lrs-core');

var UsersAPI = require('./api');

// TODO This currently does not give a way to find LRS Statements for any user except the logged-in user.

/* !
 * Get the most recent learning activity statements for the current user
 */
CloudLRS.apiRouter.get('/user/recentactivities', function(req, res) {
  UsersAPI.getUserStatements(req.ctx, req.query.limit, req.query.offset, function(err, activities) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    return res.status(200).send(activities);
  });
});

/* !
 * Get the total number of learning activities per month for the current user
 */
CloudLRS.apiRouter.get('/user/totalactivities', function(req, res) {
  UsersAPI.getTotalActivities(req.ctx, function(err, totalActivities) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    return res.status(200).send(totalActivities);
  });
});

/* !
 * Get the most frequent learning activities for the current user
 */
CloudLRS.apiRouter.get('/user/topactivities', function(req, res) {
  UsersAPI.getTopActivities(req.ctx, function(err, topActivities) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    return res.status(200).send(topActivities);
  });
});

/* !
 * Get the data sources that have generated learning activities for the current user
 */
CloudLRS.apiRouter.get('/user/datasources', function(req, res) {
  UsersAPI.getDataSources(req.ctx, function(err, dataSources) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    return res.status(200).send(dataSources);
  });
});

/* !
 * Get the different projects that potentially have access to the current user's data
 */
CloudLRS.apiRouter.get('/user/datauses', function(req, res) {
  UsersAPI.getDataUses(req.ctx, function(err, dataUses) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    return res.status(200).send(dataUses);
  });
});


/* !
 * Process user's data share opt-in/opt-out update request for different projects.
 */
CloudLRS.apiRouter.post('/user/datashare', function(req, res) {

  // Process the user's data share opt-in/opt-out request
  UsersAPI.saveUserOptOut(req.ctx, req.body, function(err) {
    if (err) {
      return res.status(err.code).send(err.msg);
    }

    return res.sendStatus(200);
  });


/* !
 * The me feed
 */
CloudLRS.apiRouter.get('/users/me', function(req, res) {
  if (!req.ctx) {
    return res.status(401).send('Unauthenticated API request');
  }

  return res.status(200).send(req.ctx.user);
});

});
