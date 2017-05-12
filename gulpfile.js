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

var addsrc = require('gulp-add-src');
var csslint = require('gulp-csslint');
var cssmin = require('gulp-cssmin');
var del = require('del');
var es = require('event-stream');
var filter = require('gulp-filter');
var fs = require('fs');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var eslint = require('gulp-eslint');
var minifyHtml = require('gulp-htmlmin');
var mocha = require('gulp-mocha');
var ngAnnotate = require('gulp-ng-annotate');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var runSequence = require('run-sequence');
var templateCache = require('gulp-angular-templatecache');
var uglify = require('gulp-uglify');
var usemin = require('gulp-usemin');
var appendData = require('gulp-append-data');
var consolidate = require('gulp-consolidate');

/**
 * Delete the build directory
 */
gulp.task('clean', function(cb) {
  del([ 'target/*' ]).then(function() {
    return cb();
  });
});

/**
 * Copy the fonts to the build directory
 */
gulp.task('copyFonts', function() {
  return gulp.src('public/lib/fontawesome/fonts/*')
    .pipe(gulp.dest('target/fonts/'));
});

/**
 * Minify the HTML, CSS and JS assets
 */
gulp.task('minify', function() {
  var pipelines = {
    'css': [cssmin({'keepSpecialComments': 0}), rev()],
    'html': [ minifyHtml({'empty': true}) ],

    // We need to register 2 pipelines with usemin as it's not able to re-use a pipeline
    // for multiple result files
    'vendor': [ngAnnotate(), uglify(), rev()],
    'app': [ngAnnotate(), uglify(), rev()],

    // Unfortunately, usemin has no way to determine the HTML partials from the index.html file.
    // We have to explicitly specify a matching glob here. All HTML partials matching the glob
    // will be returned and written to the templateCache.js
    'templateCache': [
      addsrc('public/app/**/*.html'),
      templateCache('/static/templateCache.js', {
        'module': 'cloudlrs.templates',
        'root': '/app',
        'standalone': true
      }),
      rev()
    ]
  };

  return gulp.src('./public/index.html')
    .pipe(usemin(pipelines))
    .pipe(gulp.dest('target'));
});

/**
 * Create a build
 */
gulp.task('build', function() {
  return runSequence('clean', ['copyFonts', 'minify']);
});

/**
 * Run the ESLint code style linter
 */
gulp.task('eslint', function() {
  return gulp
    .src(['app.js', 'gulpfile.js', 'apache/**/*.js', 'node_modules/lrs-*/**/*.js', 'public/**/*.js', '!public/lib/**/*.js'])
    .pipe(eslint())
    // Output results to console. Alternatively, use eslint.formatEach().
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});

/**
 * Run the CSS code style linter
 */
gulp.task('csslint', function() {
  return gulp
    .src(['public/**/*.css', '!public/lib/**/*.css'])
    .pipe(csslint({
      'adjoining-classes': false,
      'box-model': false,
      'ids': false,
      'overqualified-elements': false,
      'qualified-headings': false
    }))
    .pipe(csslint.formatter());
});
