import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      unique: true,
      required: true,
      default: () => `VST-${Math.floor(1000 + Math.random() * 9000)}`
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true
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
      required: [true, 'Visit address is required']
    },
    scheduledDate: {
      type: String,
      required: true
    },
    scheduledTime: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      required: [true, 'Visit purpose is required']
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In-Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    },
    checkInTime: {
      type: String,
      default: null
    },
    checkOutTime: {
      type: String,
      default: null
    },
    assignedTo: {
      type: String,
      default: 'Imran Khan'
    },
    notes: {
      type: String,
      default: ''
    },
    distanceKm: {
      type: String,
      default: '10.0 km'
    },
    latitude: {
      type: Number,
      default: 12.9716
    },
    longitude: {
      type: Number,
      default: 77.5946
    },
    verifiedGps: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Visit = mongoose.model('Visit', visitSchema);
export default Visit;
