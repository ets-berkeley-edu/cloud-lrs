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

    angular.module('cloudlrs').controller('DatasourcesController', function(datasourcesFactory, $filter, $scope) {

      // Variable that will keep track of the data sources data
      $scope.dataSources = null;

      // Data sources chart configuration
      $scope.dataSourcesOptions = {
        'options' : {
          'chart' : {
            'backgroundColor' : 'transparent',
            'spacing' : [0, 0, 0, 0],
            'style' : {
              'fontFamily' : '"Helvetica Neue",Helvetica,Arial,sans-serif',
            },
            'type' : 'pie'
          },
          'plotOptions': {
            'pie' : {
              'colors' : ['#003262', '#3B7EA1', '#FDB515', '#EE1F60', '#00A598', '#CFDD45', '#46535E', '#DDD5C7'],
              'tooltip' : {
                'headerFormat' : '',
                'pointFormatter' : function() {
                  return '<b>' + this.name + '</b>: ' + $filter('number')(this.total, 0) + ' (' +  this.percentage.toFixed(2) + '%)'
                },
                'valueDecimals' : 2
              }
            }
          }
        },
        'title' : {
          'text' : null
        },
        'series' : [{
          'size' : '90%',
          'innerSize' : '75%',
          'legend' : false,
          'dataLabels' : {
            'enabled' : false
          }
        }]
      };

      /**
       * Get the data sources donut chart
       *
       * @api private
       */
      var getChart = function() {
        var chartIndex = $('#privacydashboard-datasources-chart').data('highcharts-chart');
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
       * Activate the hover state on the chart segment that corresponds to
       * screenreader table row that has focus
       *
       * @param  {Number}        index            The id of the screenreader table row that has focus
       */
      $scope.screenreaderRowFocus = function(index) {
        removeHoverState();
        var chart = getChart();
        chart.series[0].data[index].setState('hover');
        chart.tooltip.refresh(chart.series[0].data[index]);
      };

      /**
       * Remove the hover state from all chart segments when
       * focus is lost
       *
       * @param  {Number}        index            The id of the screenreader table row that has lost focus
       */
      $scope.screenreaderRowBlur = function(index) {
        removeHoverState();
      };

      /**
       * Render the data sources that have generated learning activities
       * for the current user
       *
       * @api private
       */
      var renderDataSources = function() {
        datasourcesFactory.getDataSources().then(function(dataSources) {

          // Convert the provided data sources to a format readable by Highcharts
          $scope.dataSources = [];
          _.each(dataSources.data, function(dataSource) {
            $scope.dataSources.push([dataSource.name, dataSource.total]);
          });

          // Sort the data sources data
          $scope.dataSources.sort(function(a, b) {
            return b[1] - a[1];
          });

          console.log($scope.dataSources);
          $scope.dataSourcesOptions.series[0].data = $scope.dataSources;
        });
      };

      renderDataSources();

    });

  }(window.angular));
