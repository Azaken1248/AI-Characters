const mongoose = require('mongoose');
const { Schema } = mongoose;

const characterSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  id: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  },
  characterID: {
    type: String,
    required: true
  },
  flag: {
    type: String,
    required: true
  },
  serverID: {
    type: String,
    required: true
  },
  channelID: {
    type: String,
    required: true
  },
  listenerID: {
    type: String,
    required: true
  }
});

const CharacterModel = mongoose.model('Character', characterSchema);

module.exports = CharacterModel;
