/**
 * Copyright ©2017. The Regents of the University of California (Regents). All Rights Reserved.
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

(function(angular) {

  'use strict';

  angular.module('cloudlrs').service('utilService', function($cookies, $location, $q, $timeout) {

    // Cache the API domain and Course ID that were passed in through
    // the iFrame launch URL. These variables need to be used to construct
    // the base URL for all REST API requests
    var apiDomain = $location.search().api_domain;
    var courseId = $location.search().course_id;
    var toolUrl = $location.search().tool_url;

    /**
     * Get the parameters that were passed in through the iFrame launch URL
     *
     * @return {Object}                       The parameters that were passed in through the iFrame launch URL
     */
    var getLaunchParams = function() {
      var launchParams = {
        'apiDomain': apiDomain,
        'courseId': courseId,
        'toolUrl': toolUrl
      };
      return launchParams;
    };

    /**
     * Construct the full URL for a REST API request. All REST API requests should
     * be of the form `/api/<apiDomain>/<courseId>/<restAPI>`
     *
     * @param  {String}       url             The REST API for which the full REST API URL should be constructed
     * @return {String}                       The full REST API URL of the form `/api/<apiDomain>/<courseId>/<restAPI>`
     */
    var getApiUrl = function(url) {
      return '/api/' + apiDomain + '/' + courseId + url;
    };

    /**
     * Get the external tool URL for the current LTI tool placement
     *
     * @return {String}                       URL used to launch tool in current iFrame
     */
    var getToolUrl = function() {
      return toolUrl;
    };

    return {
      'getApiUrl': getApiUrl,
      'getLaunchParams': getLaunchParams,
      'getToolUrl': getToolUrl
    };

  });

}(window.angular));
