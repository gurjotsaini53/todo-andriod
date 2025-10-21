const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Todo title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Todo must belong to a user']
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
todoSchema.index({ user: 1, createdAt: -1 });
todoSchema.index({ user: 1, completed: 1 });
todoSchema.index({ user: 1, priority: 1 });
todoSchema.index({ user: 1, dueDate: 1 });

// Virtual for todo ID (without _id)
todoSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Pre-save middleware to set completedAt when todo is marked as completed
todoSchema.pre('save', function(next) {
  if (this.isModified('completed') && this.completed && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.isModified('completed') && !this.completed) {
    this.completedAt = null;
  }
  next();
});

// Instance method to toggle completion status
todoSchema.methods.toggleCompletion = function() {
  this.completed = !this.completed;
  if (this.completed && !this.completedAt) {
    this.completedAt = new Date();
  } else if (!this.completed) {
    this.completedAt = null;
  }
  return this.save();
};

// Static method to get todos by user with pagination
todoSchema.statics.getTodosByUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    completed,
    priority,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = { user: userId };
  
  if (completed !== undefined) {
    query.completed = completed;
  }
  
  if (priority) {
    query.priority = priority;
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find(query)
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('user', 'name email');
};

// Static method to get todo statistics for a user
todoSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
        pending: { $sum: { $cond: ['$completed', 0, 1] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('Todo', todoSchema);
