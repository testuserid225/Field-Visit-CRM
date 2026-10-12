import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide user full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide user email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      default: 'password123',
      select: false
    },
    role: {
      type: String,
      enum: ['Senior Field Officer', 'Territory Sales Manager', 'CRM Administrator'],
      default: 'Senior Field Officer'
    },
    territory: {
      type: String,
      default: 'Bangalore East & Central'
    },
    avatar: {
      type: String,
      default: 'IK'
    },
    isDutyActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);
export default User;
