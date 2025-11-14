const mongoose = require('mongoose');

const gameStageSchema = new mongoose.Schema({
  stage_id: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 12,
  },
  boss_name: {
    type: String,
    required: true,
  },
  boss_hp: {
    type: Number,
    required: true,
  },
  boss_attack_power: {
    type: Number,
    required: true,
  },
  boss_image_url: {
    type: String,
    default: null,
  },
  zodiac_animal: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('GameStage', gameStageSchema);
