const mongoose = require('mongoose');

const idiomSchema = new mongoose.Schema({
  idiom_id: {
    type: Number,
    required: true,
    unique: true,
  },
  hanja: {
    type: String,
    required: true,
  },
  hangul: {
    type: String,
    required: true,
  },
  meaning: {
    type: String,
    required: true,
  },
  example_sentence: {
    type: String,
    required: true,
  },
  base_difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: true,
  },
});

// Index for efficient querying
idiomSchema.index({ base_difficulty: 1 });
idiomSchema.index({ hangul: 1 });

module.exports = mongoose.model('Idiom', idiomSchema);
