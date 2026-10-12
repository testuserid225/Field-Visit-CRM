import mongoose from 'mongoose';

const contactPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contact Person Name is required'],
      trim: true
    },
    customerOrganizationName: {
      type: String,
      trim: true,
      default: ''
    },
    designation: {
      type: String,
      required: [true, 'Designation / Role is required'],
      trim: true
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile Number is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
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

const ContactPerson = mongoose.model('ContactPerson', contactPersonSchema);
export default ContactPerson;
