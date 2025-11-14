const mongoose = require('mongoose');

const learningLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stage_id: {
    type: Number,
    ref: 'GameStage',
    default: null,
  },
  idiom_id: {
    type: Number,
    ref: 'Idiom',
    required: true,
  },
  action_type: {
    type: String,
    enum: ['ATTACK', 'DEFEND', 'LEARN'],
    required: true,
  },
  chosen_difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    default: null,
  },
  is_correct: {
    type: Boolean,
    required: true,
  },
  response_time_ms: {
    type: Number,
    required: true,
  },
  calculated_damage: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
learningLogSchema.index({ user_id: 1, timestamp: -1 });
learningLogSchema.index({ user_id: 1, stage_id: 1 });
learningLogSchema.index({ user_id: 1, action_type: 1 });

module.exports = mongoose.model('LearningLog', learningLogSchema);
