const mongoose = require('mongoose');

// default expirationDate is set to 60 seconds
const expirationDate = function(){
    var timeObject = new Date();
    timeObject.setTime(timeObject.getTime() + 1000 * 60);
    return timeObject;
};

const chatSchema = mongoose.Schema({
    fromUser: {
        type: String,
        required: true
    },
    toUser: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    expireAt: {
        type: Date,
        expires: 0,
        default: expirationDate
    }
})

module.exports = mongoose.model('Chat', chatSchema);;
