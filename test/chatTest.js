const server = require('../app').server;
const Chat = require('../models/chatModel');
const mongoose = require('mongoose');
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

describe('ChatApp', function() {
    Chat.collection.drop();

    describe('POST /chat/', function() {
        it('should send new message and return JSON object with id', function(done) {
          request(server)
            .post('/chat/')
            .send({ toUser: 'user1', fromUser: 'user2', text: 'message',timeout: 1
            })
            .end(function(err, res){
                expect(err).to.be.null;
                console.log(res.body);
              res.should.have.status(201);
              res.should.be.json;
              res.body.should.be.a('object');
              res.body.should.have.property('id');
              done();
            });
        });
    });

    describe('GET /chat/:id', function() {
        it('should get one message and return JSON object with toUser, fromUser, text, expirationDate', function(done) {
          var agent = request(server);
          agent.post('/chat')
            .send({toUser: 'toUser', fromUser: 'fromUser', text: 'message', timeout: 0})
            .end(function(err, res){
                var chatID = res.body.id;
                console.log("chatID: " + chatID);
                agent.get('/chat/' +res.body.id)
                .expect(200, function(err, res){
                    console.log(res.body);
                  res.should.be.json;
                  res.body.should.be.a('object');
                  res.body.should.have.property('toUser');
                  res.body.should.have.property('fromUser');
                  res.body.should.have.property('text');
                  res.body.should.have.property('expirationDate');
                  res.body.fromUser.should.equal('fromUser');
                  res.body.toUser.should.equal('toUser');
                  res.body.text.should.equal('message');
                  done();
                })
            });

        });
    });

    describe('GET /chats/:username', function() {
        it('should return an array of JSON objects with id and text', function(done) {
          var agent = request(server);
          var username = 'eugene';
          agent.post('/chat')
            .send({toUser: username, fromUser: 'fromUser1', text: 'message1', timeout: 10})
            .end(function(err, res){
                expect(err).to.be.null;
                agent.post('/chat')
                .send({toUser: username, fromUser: 'fromUser2', text: 'message2', timeout: 10})
                .end(function(err, res){
                    expect(err).to.be.null;
                    agent.get('/chats/' + username)
                    .expect(200, function(err, res){
                        expect(err).to.be.null;
                        console.log(res.body);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.have.length(2);
                        res.body[0].should.have.property('id');
                        res.body[0].should.have.property('text');
                        res.body[0].text.should.equal('message1');
                        res.body[1].should.have.property('text');
                        res.body[1].text.should.equal('message2');
                        done();
                    })
                })
            });
        });
    });

});
