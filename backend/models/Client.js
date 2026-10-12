import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      unique: true,
      required: true,
      default: () => `CLI-${Math.floor(10 + Math.random() * 90)}`
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true
    },
    category: {
      type: String,
      required: true,
      default: 'Healthcare'
    },
    contactPerson: {
      type: String,
      default: 'Site Manager'
    },
    phone: {
      type: String,
      default: '+91 98000 00000'
    },
    email: {
      type: String,
      default: 'client@example.com'
    },
    address: {
      type: String,
      required: [true, 'Client address is required']
    },
    tier: {
      type: String,
      enum: ['Enterprise', 'Key Account', 'Growth'],
      default: 'Enterprise'
    },
    totalVisits: {
      type: Number,
      default: 0
    },
    lastVisitDate: {
      type: String,
      default: 'Never'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

const Client = mongoose.model('Client', clientSchema);
export default Client;
