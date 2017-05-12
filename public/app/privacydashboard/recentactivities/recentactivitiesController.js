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

 (function(angular) {

   'use strict';

   angular.module('cloudlrs').controller('RecentactivitiesController', function(recentactivitiesFactory, $scope) {

     // Variable that will keep track of the recent activities data
     $scope.recentActivities = [];

     // Variable that will keep track of the current page result
     $scope.currentPage = 0;

     /**
      * Load the next page of learning activities for the current user
      *
      * @return {void}
      */
     $scope.loadMoreRecentActivities = function() {
       $scope.currentPage++;
       renderRecentActivities();
     };

     /**
      * Render the most recent learning activities for the current user
      *
      * @return {void}
      * @api private
      */
     var renderRecentActivities = function() {
       recentactivitiesFactory.getRecentActivities($scope.currentPage).then(function(recentActivities) {
         $scope.recentActivities = $scope.recentActivities.concat(recentActivities.data.results);

         _.each($scope.recentActivities, function(activity) {
           // Extract the readable verb

           if (activity.statement_type === 'XAPI') {
             activity.readableVerb = activity.verb.split('/').pop();
             if (_.get(activity.statement, 'verb.display')) {
               activity.readableVerb = _.values(activity.statement.verb.display)[0];
             }

           } else if (activity.statement_type === 'CALIPER') {
             activity.readableVerb = activity.activity_type.split('/').pop();
           }

           // Extract the readable object
           activity.readableObject = null;
           if (_.get(activity.statement, 'object.definition.name')) {
             activity.readableObject = _.values(activity.statement.object.definition.name)[0];
           } else if (_.get(activity.statement, 'object.id')) {
             activity.readableObject = activity.statement.object.id;
           }

           // Extract the readable object type
           activity.readableObjectType = null;
           if (_.get(activity.statement, 'object.definition.type')) {
             activity.readableObjectType = activity.statement.object.definition.type.split('/').pop();
           }

           // Extract the readable context
           activity.readableContext = null;
           if (_.get(activity.statement, 'context.contextActivities.grouping[0].definition.name')) {
             activity.readableContext = _.values(activity.statement.context.contextActivities.grouping[0].definition.name)[0];
           }

           // Extract the readable context type
           activity.readableContextType = null;
           if (_.get(activity.statement, 'context.contextActivities.grouping[0].definition.type')) {
             activity.readableContextType = activity.statement.context.contextActivities.grouping[0].definition.type.split('/').pop();
           }

           // Extract a readable date and time
           var timestamp = moment(activity.timestamp);
           activity.date = timestamp.format('MMM D, YYYY');
           activity.time = timestamp.format('hh:mm:ss a');
         });
       });
     };

     renderRecentActivities();

   });

 }(window.angular));
