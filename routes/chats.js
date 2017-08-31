const express = require('express');
const router = express.Router();
const Chat = require('../models/chatModel');
const mongoose = require('mongoose');

// GET request to retrieve all unexpired messagesfor the given username
router.get('/:username', function(req, res, next) {
    var username = req.params.username;
    if (username != null && username != '' && username.match(/^[a-z0-9]+$/i) != null) {
        Chat.find({'toUser': username, 'expireAt': { $gt: new Date() }}, {'fromUser': 0, 'toUser': 0, 'expireAt': 0, '__v': 0})
            .exec(function (err, docs) {
            if (err) {
                res.status(500).json({error: 'Server error: Database search'});
            }
            if (docs != null && docs.length > 0) {
                // convert key from _id to id
                var str = JSON.stringify(docs).replace(/\"_id\":/g, "\"id\":");
                res.json(JSON.parse(str));
                // delete messages after finish displaying messages
                res.on('finish', function() {
                    Chat.remove({'toUser': username}, function (err) {
                      if (err) {
                          console.log('Server error: Database delete. Messages were not removed). ' + err);
                          return;
                      } else {
                          console.log('Removed messages successfully.');
                        }
                    });
                })
            } else {
                res.status(404).json({error: 'No unexpired messages found for user ' + username +'.'});
            }
        });
    } else {
        res.status(400).json({error: 'Invalid request. Username must be alphanumeric without spaces.'});
    }
});

module.exports = router;
