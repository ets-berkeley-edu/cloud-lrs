const should = require('should');
const request = require('supertest');

var CloudLRS = require('../index.js');
var shared = require('./shared');

var apiPath = function(data, api) {
  return '/api/' + data.tenantAPIDomain + '/' + data.canvasCourseID + api;
};

describe('Tests against running server', function() {
  var server;
  var testData;
  before(function(done) {
    shared.setupRunningServer(function(generatedData) {
      testData = generatedData;
      server = CloudLRS.appServer;
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

  describe('With LTI-styled cookie authentication', function() {
    describe('/user/recentactivities', function() {
      it('requires authentication', function(done) {
        request(server)
          .get(apiPath(testData, '/user/recentactivities'))
          .expect(401, 'Incorrect cookie information present', done);
      });
      it('supports LTI-based authentication', function(done) {
        var agent = request.agent(server);
        agent.post('/fake_launch')
          .send({ api_domain: testData.tenantAPIDomain, course_id: testData.canvasCourseID, user_id: testData.userID })
          .end(function(err, res) {
            agent.get(apiPath(testData, '/user/recentactivities'))
              .expect(200)
              .end(function(err, res) {
                if (err) return done(err);
                res.body.total.should.equal(2);
                res.body.results.should.have.lengthOf(2);
                return done();
              });
          });
      });
    });
  });
});
