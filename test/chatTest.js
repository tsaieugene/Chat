const server = require('../app').server;
const Chat = require('../models/chatModel');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);

describe('ChatApp', function() {
    Chat.collection.drop();

    describe('POST /chat/', function() {
        it('should send new message and return JSON object with id', function(done) {
          chai.request(server)
            .post('/chat/')
            .send({ toUser: 'joe', fromUser: 'rob', text: 'Hi friend',timeout: 1
            })
            .end(function(err, res){
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
        it('should get one message and return JSON object with toUser, fromUser, text, expirationDate', function() {
          chai.request(server)
            .post('/chat')
            .send({toUser: 'eugenee', fromUser: 'e', text: 'c', timeout: 0})
            .end(function(err, res){
                chai.request(server)
                .get('/chat/' +res.body.id)
                .end(function(e, r){
                    console.log(r.body);
                  r.should.have.status(200);
                  r.should.be.json;
                  r.body.should.be.a('object');
                  r.body.should.have.property('toUser');
                  r.body.should.have.property('fromUser');
                  r.body.should.have.property('text');
                  r.body.should.have.property('expirationDate');
                  r.body.fromUser.should.equal.property('rob');
                  r.body.toUser.should.equal.property('eugene');
                  r.body.text.should.equal.property('text');
                })
            });

        });
    });

    describe('GET /chats/:username', function() {
        it('should return an array of JSON objects with id and text', function() {
          chai.request(server)
            .post('/chat')
            .send({toUser: 'eugene', fromUser: 'fasdf', text: 'gfgfdg', timeout: 0})
            .end(function(err, res){
                chai.request(server)
                .post('/chat')
                .send({toUser: 'eugene', fromUser: 'r', text: 'ff', timeout: 0})
                .end(function(e, r){
                    chai.request(server)
                    .get('/chats/eugene')
                    .end(function(err, res){
                        console.log(res.body);
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.have.length(2);
                        res.body[0].should.have.property('id');
                        res.body[0].should.have.property('text');
                        res.body[0].text.should.equal('gfgfdg');
                        res.body[1].text.should.equal('ff');
                        res.body.text.should.equal.property('text');
                    })
                })
            });
        });
    });

});
