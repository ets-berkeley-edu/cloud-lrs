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
var bodyParser = require('body-parser');
var config = require('config');
var cookieParser = require('cookie-parser');
var express = require('express');
var http = require('http');
var util = require('util');

var log = require('./logger')('lrs-core/server');

var safePathPrefixes = [];

/**
 * Start the Learning Record Store Express server on the configured port
 *
 * @return {Express}                The created express server
 */
var setUpServer = module.exports.setUpServer = function() {
  // Create the express server
  var app = express();

  // Expose the HTTP server on the express app to allow other modules to hook into it
  app.httpServer = http.createServer(app);

  // Start listening for requests
  var port = config.get('app.port');

  app.httpServer.listen(port, 'localhost');

  // Don't output pretty JSON
  app.set('json spaces', 0);

  // Don't output the x-powered-by header
  app.set('x-powered-by', false);

  // Indicate that the Learning Record Store is being used behind a reverse proxy
  // @see http://expressjs.com/guide/behind-proxies.html
  app.enable('trust proxy');

  // LRS stores a user's id in a signed cookie
  app.use(cookieParser(config.get('cookie.secret')));

  // Always set a P3P (Privacy Preferences Platform) Header with a Compact Policy. Safari and IE
  // require this header to be set or they will discard our cookies, breaking authentication
  // @see http://www.w3.org/TR/P3P11/#compact_policy_vocabulary
  app.use(function(req, res, next) {
    res.set('P3P', 'CP="NOI ADM DEV PSAi COM NAV OUR OTR STP IND DEM"');
    next();
  });

  // Parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({
    'extended': false
  }));

  // Parse application/json
  app.use(bodyParser.json());

  /* !
   * Referer-based CSRF protection. If the request is not safe (e.g., POST, DELETE) and the origin of the request (as
   * specified by the HTTP Referer header) does not match the target host of the request (as specified by the HTTP
   * Host header), then the request will result in a 500 error.
   *
   * While referer-based protection is not highly recommended due to spoofing possibilities in insecure environments,
   * it currently offers the best trade-off between ease of use (e.g., for cURL interoperability), effort and security
   * against CSRF attacks.
   *
   * Middleware that gets called earlier, can force the CSRF check to be skipped by setting `checkCSRF` on the request.
   *
   * If using a utility such as `curl` to POST requests to the API, you can bypass this by just setting the referer
   * header to "/".
   *
   * More information about CSRF attacks: http://en.wikipedia.org/wiki/Cross-site_request_forgery
   */
  app.use(function(req, res, next) {
    // Skip the CSRF check if an authorization header is proved
    if (req.headers.authorization) {
      return next();
    }

    if (!isSafeMethod(req.method) && !isSafePath(req) && !isSameOrigin(req)) {
      log.warn({
        'method': req.method,
        'host': req.headers.host,
        'referer': req.headers.referer,
        'targetPath': req.path
      }, 'CSRF validation failed: attempted to execute unsafe operation from untrusted origin');
      return abort(res, 500, 'CSRF validation failed: attempted to execute unsafe method from untrusted origin');
    }

    return next();
  });

  // Catch-all error handler
  app.use(function(err, req, res, next) {
    log.error({
      err: err,
      req: req,
      res: res
    }, 'Unhandled error in the request chain, caught at the default error handler');
    return abort(res, 500, 'An unexpected error occurred');
  });

  log.info(util.format('Learning Record Store server is listening at http://127.0.0.1:%s', port));

  return app;
};

/**
 * Abort a request with a given code and response message
 *
 * @param  {Response}   res         The express response object
 * @param  {Number}     code        The HTTP response code
 * @param  {String}     message     The message body to provide as a reason for aborting the request
 * @api private
 */
var abort = function(res, code, message) {
  res.setHeader('Connection', 'Close');
  return res.status(code).send(message);
};


/**
 * Add a path to the list of safe paths. Paths added here will not be protected against CSRF
 * attacks. This is common for endpoints that have other verification mechanisms such as LTI.
 *
 * @param  {String}     pathPrefix        A path prefix that will not be validated against CSRF attacks
 */
var addSafePathPrefix = module.exports.addSafePathPrefix = function(pathPrefix) {
  log.info('Adding %s to list of paths that are not CSRF-protected.', pathPrefix);
  safePathPrefixes.push(pathPrefix);
};


/**
 * Determine whether the target path for a request is considered "safe" from CSRF attacks
 *
 * @param  {Request}    req         The express request object
 * @return {Boolean}                `true` if the path is safe from CSRF attacks, `false` otherwise
 * @api private
 */
var isSafePath = function(req) {
  var path = req.path;
  var matchingPaths = _.filter(safePathPrefixes, function(safePathPrefix) {
    return (path.indexOf(safePathPrefix) === 0);
  });
  return (matchingPaths.length > 0);
};

/**
 * Determine whether the given request method is considered "safe"
 *
 * @param  {String}     method      The request method
 * @return {Boolean}                `true` if the request method is safe (e.g., GET, HEAD, OPTIONS), `false` otherwise
 * @api private
 */
var isSafeMethod = function(method) {
  return (method === 'GET' || method === 'HEAD' || method === 'OPTIONS');
};

/**
 * Determine whether the origin host of the given request is the same as the target host
 *
 * @param  {Request}    req         The express request object to test
 * @return {Boolean}                `true` if the request is of the same origin as the target host, `false` otherwise
 * @api private
 */
var isSameOrigin = function(req) {
  var host = req.headers.host;
  var referer = req.headers.referer;

  if (!referer) {
    return false;
  }

  if (referer.indexOf('/') !== 0) {
    // Verify the host portion against the host header
    referer = referer.split('://')[1];
    if (!referer || referer.split('/')[0] !== host) {
      // If there is nothing after the protocol (e.g., 'http://') or the host before the first slash does not match
      // we deem it not to be the same origin
      return false;
    } else {
      return true;
    }
  } else {
    // If the referer is a relative uri, it must be from the same origin
    return true;
  }
};
