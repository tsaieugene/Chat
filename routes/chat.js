const express = require('express');
const router = express.Router();
const Chat = require('../models/chatModel');
const mongoose = require('mongoose');

// GET request to retrieve the message object for the given id
router.get('/:id', function(req, res, next) {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        var id = mongoose.Types.ObjectId(req.params.id);
        Chat.findOne({'_id': id}, {'_id': 0, '__v':0})
            .exec(function (err, docs) {
            if (err) {
                res.status(500).json({error: 'Server error: Database search'});
            }
            if (docs != null) {
                res.json({fromUser: docs.fromUser, toUser: docs.toUser, text: docs.text, expirationDate: docs.expireAt});
            } else {
                res.status(404).json({error: 'Message was not found. It may have expired. Try refreshing by clicking on the same user again.'});
            }
        });
    } else {
        res.status(400).json({error: 'Invalid path parameter: ID must be a single String of 12 bytes or a string of 24 hex characters'});
    }
});

// POST request to retrieve the message object for the given id
router.post('/', function(req, res, next) {
    var data = req.body;
        // Create expiration date by adding timeout seconds to current date
        if (data != null) {
            var timeObject = new Date();
            timeObject.setTime(timeObject.getTime() + 1000 * data.timeout);
            var expirationDate = timeObject;
            var chat = new Chat({
                fromUser: data.fromUser,
                toUser: data.toUser,
                text: data.text,
                expireAt: expirationDate
                });

        chat.save(function(err, chat) {
            if (err) {
                res.status(500).json({error: 'Server error: Database save'});
            } else {
                data.messageId = chat._id;
                // emit message to the intended recipient if he online
                if (data.toUser in req.users) {
                    req.users[data.toUser].emit('new message', data);
                }
                res.status(201).json({id: data.messageId});
            }
        });
    }
});

module.exports = router;
