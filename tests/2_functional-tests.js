const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testId; // Variable para guardar un ID y usarlo en pruebas de PUT/DELETE

suite('Functional Tests', function() {

    this.timeout(5000);
  
  suite('POST /api/issues/{project} => Create issue object', function() {
    
    test('Create an issue with every field', function(done) {
      chai.request(server)
        .post('/api/issues/testproject')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Title');
          assert.equal(res.body.assigned_to, 'Chai and Mocha');
          assert.equal(res.body.created_by, 'Functional Test - Every field');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'updated_on');
          testId = res.body._id; // Guardamos el ID para pruebas futuras
          done();
        });
    });

    test('Create an issue with only required fields', function(done) {
      chai.request(server)
        .post('/api/issues/testproject')
        .send({
          issue_title: 'Title Required',
          issue_text: 'text required',
          created_by: 'Functional Test - Required'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.issue_title, 'Title Required');
          assert.equal(res.body.created_by, 'Functional Test - Required');
          assert.equal(res.body.assigned_to, ''); // Default
          assert.equal(res.body.status_text, ''); // Default
          done();
        });
    });

    test('Create an issue with missing required fields', function(done) {
      chai.request(server)
        .post('/api/issues/testproject')
        .send({
          issue_title: 'Title Missing'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'required field(s) missing' });
          done();
        });
    });
    
  });

  suite('GET /api/issues/{project} => View issues', function() {
    
    test('View issues on a project', function(done) {
      chai.request(server)
        .get('/api/issues/testproject')
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          done();
        });
    });

    test('View issues on a project with one filter', function(done) {
      chai.request(server)
        .get('/api/issues/testproject')
        .query({ created_by: 'Functional Test - Every field' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          res.body.forEach(issue => {
            assert.equal(issue.created_by, 'Functional Test - Every field');
          });
          done();
        });
    });

    test('View issues on a project with multiple filters', function(done) {
      chai.request(server)
        .get('/api/issues/testproject')
        .query({ created_by: 'Functional Test - Every field', issue_title: 'Title' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          res.body.forEach(issue => {
            assert.equal(issue.created_by, 'Functional Test - Every field');
            assert.equal(issue.issue_title, 'Title');
          });
          done();
        });
    });
    
  });

  suite('PUT /api/issues/{project} => Update object', function() {
    
    test('Update one field on an issue', function(done) {
      chai.request(server)
        .put('/api/issues/testproject')
        .send({
          _id: testId,
          issue_text: 'Updated text'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', '_id': testId });
          done();
        });
    });

    test('Update multiple fields on an issue', function(done) {
      chai.request(server)
        .put('/api/issues/testproject')
        .send({
          _id: testId,
          issue_text: 'Updated text again',
          open: false
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully updated', '_id': testId });
          done();
        });
    });

    test('Update an issue with missing _id', function(done) {
      chai.request(server)
        .put('/api/issues/testproject')
        .send({
          issue_text: 'No ID provided'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });

    test('Update an issue with no fields to update', function(done) {
      chai.request(server)
        .put('/api/issues/testproject')
        .send({
          _id: testId
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'no update field(s) sent', '_id': testId });
          done();
        });
    });

    test('Update an issue with an invalid _id', function(done) {
      chai.request(server)
        .put('/api/issues/testproject')
        .send({
          _id: '5f665eb46e296f6b9b6a504d', // ID falso pero formato válido
          issue_text: 'Invalid ID'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not update', '_id': '5f665eb46e296f6b9b6a504d' });
          done();
        });
    });
    
  });

  suite('DELETE /api/issues/{project} => Delete issue', function() {
    
    test('Delete an issue', function(done) {
      chai.request(server)
        .delete('/api/issues/testproject')
        .send({
          _id: testId
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { result: 'successfully deleted', '_id': testId });
          done();
        });
    });

    test('Delete an issue with an invalid _id', function(done) {
      chai.request(server)
        .delete('/api/issues/testproject')
        .send({
          _id: '5f665eb46e296f6b9b6a504d' // ID falso
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'could not delete', '_id': '5f665eb46e296f6b9b6a504d' });
          done();
        });
    });

    test('Delete an issue with missing _id', function(done) {
      chai.request(server)
        .delete('/api/issues/testproject')
        .send({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.deepEqual(res.body, { error: 'missing _id' });
          done();
        });
    });
    
  });

});