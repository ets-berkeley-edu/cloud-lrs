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

( function(angular) {

    'use strict';

    angular.module('cloudlrs').controller('TotalactivitiesController', function(totalactivitiesFactory, $filter, $scope) {

      // Variable that will keep track of the total activities per month for the current user
      $scope.totalActivities = null;

      // Total activities chart configuration
      $scope.totalActivitiesOptions = {
        'options' : {
          'chart' : {
            'backgroundColor' : 'transparent',
            'spacing' : [100, 30, 30, 30],
            'style' : {
              'fontFamily' : '"Helvetica Neue",Helvetica,Arial,sans-serif',
            }
          },
          'legend' : {
            'align' : 'left',
            'floating' : true,
            'itemStyle' : {
              'fontWeight' : 400
            },
            'verticalAlign' : 'top',
            'x' : -5,
            'y' : -80
          },
          'tooltip' : {
            'backgroundColor' : '#FFF',
            'headerFormat' : '',
            'pointFormat' : '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>',
            'shared' : true
          }
        },
        'title' : {
          'text' : null
        },
        'plotOptions' : {
          'series' : {
            'animation' : false
          }
        },
        'xAxis' : {
          'labels' : {
            'autoRotation' : [0, -90],
            'style' : {
              'cursor' : 'pointer',
              'fontSize' : '13px'
            },
            'useHTML' : true
          },
          'lineColor' : '#CCC',
          'minorTickLength' : 0,
          'tickLength' : 0
        },
        'yAxis' : {
          'labels' : {
            'style' : {
              'cursor' : 'pointer',
              'fontSize' : '13px'
            }
          },
          'lineColor' : '#CCC',
          'lineWidth' : 1,
          'gridLineColor' : '#EEEEEE',
          'min' : 0,
          'title' : {
            'text' : null
          }
        },
        'series' : [{
          'color' : '#3B7EA1',
          'marker' : {
            'lineColor' : null,
            'lineWidth' : 4,
            'symbol' : 'circle'
          },
          'name' : 'Total activities'
        }]
      };

      /**
       * Get the chart that corresponds to the total activities chart
       *
       * @api private
       */
      var getChart = function() {
        var chartIndex = $('#privacydashboard-totalactivities-chart').data('highcharts-chart');
        return Highcharts.charts[chartIndex];
      };

      /**
       * Remove the hover state from all chart segments
       *
       * @api private
       */
      var removeHoverState = function() {
        var chart = getChart();
        for (var i = 0; i < chart.series[0].data.length; i++) {
          chart.series[0].data[i].setState();
        }
        chart.tooltip.hide();
      };

      /**
       * Activate the hover state on the total activities chart segment that corresponds to
       * the screenreader table row that has focus
       *
       * @param  {Number}        index            The id of the screenreader total activities table row that has focus
       *
       */
      $scope.screenreaderRowFocus = function(index) {
        removeHoverState();
        var chart = getChart();
        chart.series[0].data[index].setState('hover');
        chart.tooltip.refresh([chart.series[0].data[index]]);
      };

      /**
       * Remove the hover state from all total activities chart segments when
       * focus is lost
       *
       * @param  {Number}        index            The id of the screenreader total activities table row that has lost focus
       */
      $scope.screenreaderRowBlur = function(index) {
        removeHoverState();
      };

      /**
       * Render the total activities per month for the current user
       *
       * @api private
       */
      var renderTotalActivities = function() {
        totalactivitiesFactory.getTotalActivities().then(function(totalActivities) {
          $scope.totalActivities = totalActivities.data;

          // Convert the provided total activity numbers to a format readable by Highcharts
          $scope.totalActivitiesOptions.xAxis.categories = _.map($scope.totalActivities, 'period');

          // TODO : Remove the ! condition for production.
          // Current is a boolean denoting if the semester is current or not. Historical data is used for development purposes
          // Hence checking for current always renders false. Hence using the ! condition to negate it.

          // Change the current month to a dotted line
          if (!$scope.totalActivities[$scope.totalActivities.length - 1].current) {
            $scope.totalActivitiesOptions.series[0].zoneAxis = 'x';
            $scope.totalActivitiesOptions.series[0].zones = [{
              'value' : $scope.totalActivities.length - 2
            }, {
              'dashStyle' : 'dot'
            }];
          }

          $scope.totalActivitiesOptions.series[0].data = _.map($scope.totalActivities, 'total');
          console.log(_.map($scope.totalActivities, 'total'));
        });
      };

      renderTotalActivities();

    });

  }(window.angular));
