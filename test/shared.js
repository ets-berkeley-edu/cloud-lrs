const randomstring = require('randomstring');

var CloudLRS = require('../index.js');
var DB = require('../lib/lrs-core/db.js');

/**
 * Creates a linked combination of one Tenant, one User, one Course, one Write Credential, and two
 * sample Statements. It can be called multiple times to check for proper authorization checks.
 */
var seedDataSet = exports.seedDataSet = function (db, callback) {
  var externalUserID = randomstring.generate({charset: 'numeric', length: 8});
  var sourceCredentialKey = randomstring.generate({length: 8}) + '-source';
  var sourceCredentialSecret = randomstring.generate({length: 8});
  var consumerCredentialKey = randomstring.generate({length: 8}) + '-consumer';
  var consumerCredentialSecret = randomstring.generate({length: 8});
  db.Tenant.create({
    name: randomstring.generate({charset: 'alphabetic', length: 6}) + ' University'
  }).then(function(tenant) {
    db.User.create({
      external_id: externalUserID,
      name: 'J. D. Hackensacker ' + externalUserID,
      tenant_id: tenant.id
    }).then(function(user) {
      db.Credential.create({
        name: sourceCredentialKey,
        key: sourceCredentialKey,
        secret: sourceCredentialSecret,
        read_permission: true,
        write_permission: true,
        datashare: false,
        tenant_id: tenant.id
      }).then(function (sourceCredential) {
        db.Credential.create({
          name: consumerCredentialKey,
          key: consumerCredentialKey,
          secret: consumerCredentialSecret,
          read_permission: true,
          write_permission: false,
          datashare: true,
          tenant_id: tenant.id
        }).then(function (consumerCredential) {
          db.Statement.bulkCreate([{
            uuid: randomstring.generate({length: 36}),
            statement: '{"@context":"http://purl.imsglobal.org/ctx/caliper/v1p1","uuid":"ba766607-d1e7-4bc5-b0d0-db2c7454b632","type":"NavigationEvent","actor":{"id":"http://caliper.canvaslms.com/live-events/users/10720000004866442","type":"Person","extensions":[{"user_login":"1049291","root_account_id":"10720000000090242","root_account_lti_guid":"000acc84f0c185947403946f09656fee7c0e18f7.ucberkeley.instructure.com"}]},"action":"NavigatedTo","object":{"id":"http://caliper.canvaslms.com/live-events/assets/enrollment/10720000027580395","type":"Entity","extensions":[{"asset_type":"enrollment"}]},"eventTime":"2017-04-20T17:46:01.000Z","edApp":{"id":"http://caliper.canvaslms.com/live-events","type":"SoftwareApplication"},"group":{"id":"http://caliper.canvaslms.com/live-events/courses/10720000001461391","type":"CourseOffering","extensions":[{"context_type":"Course"}]},"membership":{"id":"http://caliper.canvaslms.com/live-events/courses/10720000001461391/users/10720000004866442","type":"Membership","member":{"id":"http://caliper.canvaslms.com/live-events/users/10720000004866442","type":"Person"},"organization":{"id":"http://caliper.canvaslms.com/live-events/courses/10720000001461391","type":"CourseOffering"}},"session":{"id":"http://caliper.canvaslms.com/live-events/sessions/e9be5b3ece4e7211f09e2c9454ca5e33","type":"Session"},"extensions":[{"hostname":"ucberkeley.beta.instructure.com","request_id":"d9c07811-9097-456b-aa11-4f8c5293f7c0","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36"}],"timestamp":"2017-04-20T17:46:01.000Z"}',
            verb: 'NavigationEvent',
            timestamp: '2017-04-20 10:46:01-07',
            activity_type: 'NavigatedTo',
            actor_type: 'Person',
            statement_type: 'CALIPER',
            statement_version: 'v1p1',
            tenant_id: tenant.id,
            user_id: user.id,
            credential_id: sourceCredential.id
          }, {
            uuid: randomstring.generate({length: 36}),
            statement: '{"@context":"http://purl.imsglobal.org/ctx/caliper/v1p1","uuid":"988ac693-5c1c-4f9a-ad7c-2f0edd4c074e","type":"OutcomeEvent","actor":{"id":"http://caliper.canvaslms.com/live-events/users/10720000004301844","type":"Person","extensions":[{"real_user_id":"10720000004866442","user_login":"300877","root_account_id":"10720000000090242","root_account_lti_guid":"000acc84f0c185947403946f09656fee7c0e18f7.ucberkeley.instructure.com"}]},"action":"Graded","object":{"id":"http://caliper.canvaslms.com/live-events/courses/10720000001461429/assignments/10720000007797393/submissions/10720000071951675","type":"Attempt","dateCreated":"2017-04-28T20:03:38.000Z","extensions":[{"submission_type":"online_upload"}],"assignee":{"id":"http://caliper.canvaslms.com/live-events/users/10720000004301844","type":"Person"},"assignable":{"id":"http://caliper.canvaslms.com/live-events/courses/10720000001461429/assignments/10720000007797393","type":"AssignableDigitalResource"},"count":1},"eventTime":"2017-04-28T20:03:38.000Z","edApp":{"id":"http://caliper.canvaslms.com/live-events","type":"SoftwareApplication"},"group":{"id":"http://caliper.canvaslms.com/live-events/courses/10720000001461429","type":"CourseOffering","extensions":[{"context_type":"Course"}]},"membership":{"id":"http://caliper.canvaslms.com/live-events/courses/10720000001461429/Learner/10720000004301844","type":"Membership","member":{"id":"http://caliper.canvaslms.com/live-events/users/10720000004301844","type":"Person"},"organization":{"id":"http://caliper.canvaslms.com/live-events/courses/10720000001461429","type":"CourseOffering"},"roles":["Learner"]},"session":{"id":"http://caliper.canvaslms.com/live-events/sessions/422436c3a8ed598b92bd14d308199703","type":"Session"},"extensions":[{"hostname":"ucberkeley.beta.instructure.com","request_id":"a90ad21b-83b3-44ae-bd30-6f623d328e1f","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36"}],"timestamp":"2017-04-28T20:03:38.000Z"}',
            verb: 'OutcomeEvent',
            timestamp: '2017-04-28 13:03:38-07',
            activity_type: 'Graded',
            actor_type: 'Person',
            statement_type: 'CALIPER',
            statement_version: 'v1p1',
            tenant_id: tenant.id,
            user_id: user.id,
            credential_id: sourceCredential.id
          }]).then(function (statements) {
            return callback({
              tenant: tenant,
              user: user,
              sourceCredential: sourceCredential,
              consumerCredential: consumerCredential,
              statements: statements
            });
          });
        });
      });
    });
  });
};

/**
 * For use in "before" or "beforeEvery" functions when tests need a running Cloud LRS server and
 * a populated DB.
 */
var setupRunningServer = exports.setupRunningServer = function(callback) {
  CloudLRS.init(function() {
    seedDataSet(DB, function(generatedData) {
      return callback(generatedData);
    });
  });
};

/**
 * For use in "after" or "afterEvery" functions.
 */
var teardownRunningServer = exports.teardownRunningServer = function(callback) {
  CloudLRS.appServer.httpServer.close(callback);
};
