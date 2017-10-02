const async = require('async');
const randomstring = require('randomstring');
const request = require('supertest');
const should = require('should');

var CloudLRS = require('../index.js');
var DB = require('../lib/lrs-core/db.js');
var shared = require('./shared');

describe('Tests against running server', function() {
  var server;
  var testData;
  var apiPath;

  before(function(done) {
    shared.setupRunningServer(function(generatedData) {
      testData = generatedData;
      server = CloudLRS.appServer;
      apiPath = function(api, userExternalId) {
        userExternalId = userExternalId || testData.user.external_id;
        return '/api/user/' + userExternalId + api;
      };
      return done();
    });
  });
  after(function(done) {
    shared.teardownRunningServer(done);
  });

  it('is rootless', function(done) {
    request(server)
      .get('/')
      .set('Accept', 'application/json')
      .expect(404, done);
  });

  describe('/recentactivities', function() {
    it('requires authentication', function(done) {
      request(server)
        .get(apiPath('/recentactivities'))
        .expect(401, 'Unauthenticated API request. Check credentials!', done);
    });
    it('allows access with same tenant', function(done) {
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/recentactivities'))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.total.should.equal(2);
          res.body.results.should.have.lengthOf(2);
          return done();
        });
    });
    it('misses access with a different tenant', function(done) {
      shared.seedDataSet(DB, function(otherTenantData) {
        var credential = otherTenantData.consumerCredential;
        request(server)
          .get(apiPath('/recentactivities'))
          .auth(credential.key, credential.secret)
          .expect(200)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.total.should.equal(0);
            res.body.results.should.have.lengthOf(0);
            return done();
          });
      });
    });
    it('returns zero results when the user is not found', function(done) {
      var externalIdOfTheUnknownUser = randomstring.generate({charset: 'numeric', length: 10});
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/recentactivities', externalIdOfTheUnknownUser))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.total.should.equal(0);
          res.body.results.should.have.lengthOf(0);
          return done();
        });
    });
  });

  describe('/totalactivities', function() {
    it('allows access with same tenant', function(done) {
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/totalactivities'))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.lengthOf(1);
          return done();
        });
    });
    it('returns an empty array when the user is not found', function(done) {
      var externalIdOfTheUnknownUser = randomstring.generate({charset: 'numeric', length: 10});
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/totalactivities', externalIdOfTheUnknownUser))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.lengthOf(0);
          return done();
        });
    });
  });

  describe('/topactivities', function() {
    it('allows access with same tenant', function(done) {
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/topactivities'))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.lengthOf(2);
          return done();
        });
    });
    it('returns an empty array when the user is not found', function(done) {
      var externalIdOfTheUnknownUser = randomstring.generate({charset: 'numeric', length: 10});
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/topactivities', externalIdOfTheUnknownUser))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.lengthOf(0);
          return done();
        });
    });
  });

  describe('/datasources', function() {
    it('allows access with same tenant', function(done) {
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/datasources'))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.lengthOf(1);
          res.body[0].name.should.equal(testData.sourceCredential.name);
          res.body[0].total.should.equal(2);
          return done();
        });
    });
    it('returns an empty array when the user is not found', function(done) {
      var externalIdOfTheUnknownUser = randomstring.generate({charset: 'numeric', length: 10});
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/datasources', externalIdOfTheUnknownUser))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.lengthOf(0);
          return done();
        });
    });
  });

  describe('/datauses', function() {
    it('allows access with same tenant', function(done) {
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/datauses'))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.lengthOf(1);
          res.body[0].name.should.equal(testData.consumerCredential.name);
          return done();
        });
    });
    it('returns tenant consumers even if the user is not found', function(done) {
      var externalIdOfTheUnknownUser = randomstring.generate({charset: 'numeric', length: 10});
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('/datauses', externalIdOfTheUnknownUser))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.should.have.lengthOf(1);
          res.body[0].name.should.equal(testData.consumerCredential.name);
          return done();
        });
    });
  });

  describe('get user data', function() {
    it('allows access with same tenant', function(done) {
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath(''))
        .auth(credential.key, credential.secret)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          res.body.external_id.should.equal(testData.user.external_id);
          res.body.name.should.equal(testData.user.name);
          res.body.tenant.name.should.equal(testData.tenant.name);
          return done();
        });
    });
    it('returns 404 when the user is not found', function(done) {
      var externalIdOfTheUnknownUser = randomstring.generate({charset: 'numeric', length: 10});
      var credential = testData.consumerCredential;
      request(server)
        .get(apiPath('', externalIdOfTheUnknownUser))
        .auth(credential.key, credential.secret)
        .expect(404, done);
    });
  });

  describe('opt-out', function() {
    it('supports opt-outs from same tenant even when user is not yet known', function(done) {
      var newUser = randomstring.generate({charset: 'numeric', length: 10});
      var sourceCredential = testData.sourceCredential;
      var consumerCredential = testData.consumerCredential;
      var consumerDataUseSetting;
      async.waterfall([
        function(callback) {
          // Test our assumption that the user is not yet defined in the DB.
          request(server)
            .get(apiPath('', newUser))
            .auth(sourceCredential.key, sourceCredential.secret)
            .expect(404, callback);
        },
        function(res, callback) {
          request(server)
            .get(apiPath('/datauses', newUser))
            .auth(sourceCredential.key, sourceCredential.secret)
            .expect(200, callback);
        },
        function(res, callback) {
          // Check that we find the expected potential data consumer.
          consumerDataUseSetting = res.body[0];
          consumerDataUseSetting.name.should.equal(consumerCredential.name);

          // Pretend that the user would prefer not to be consumed.
          consumerDataUseSetting.share = false;
          request(server)
            .post(apiPath('/datashare', newUser))
            .auth(sourceCredential.key, sourceCredential.secret)
            .send(consumerDataUseSetting)
            .expect(200, callback);
        },
        function(res, callback) {
          // Make sure that the producer can see the new user.
          request(server)
            .get(apiPath('', newUser))
            .auth(sourceCredential.key, sourceCredential.secret)
            .expect(200, callback);
        },
        function(res, callback) {
          res.body.external_id.should.equal(newUser);

          // Make sure that the consumer can not see the user.
          request(server)
            .get(apiPath('', newUser))
            .auth(consumerCredential.key, consumerCredential.secret)
            .expect(404, callback);
        },
        function(res, callback) {
          // Pretend that the user now welcomes assimilation.
          consumerDataUseSetting.share = true;
          request(server)
            .post(apiPath('/datashare', newUser))
            .auth(sourceCredential.key, sourceCredential.secret)
            .send(consumerDataUseSetting)
            .expect(200, callback);
        },
        function(res, callback) {
          // Make sure that the consumer can now see the user.
          request(server)
            .get(apiPath('', newUser))
            .auth(consumerCredential.key, consumerCredential.secret)
            .expect(200, callback);
        }
      ], function(err, result) {
        should.not.exist(err);
        return done();
      });
    });
  });

});
