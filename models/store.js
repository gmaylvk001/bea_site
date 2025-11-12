import mongoose from 'mongoose';

const StoreSchema = new mongoose.Schema({
  organisation_name: {
    type: String,
    required: [true, 'Please provide an organisation name'],
    maxlength: [100, 'Organisation name cannot be more than 100 characters'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
  default: null
  },
  description: {
    type: String,
    required: false,
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  logo: {
    type: String,
  },
  store_images: [{
    type: String,
  }],
  location: {
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters'],
  },
  location_map: {
    type: {
      lat: Number,
      lng: Number,
      address: String,
    },
  },
  zipcode: {
    type: String,
    maxlength: [20, 'Zipcode cannot be more than 20 characters'],
  },
  address: {
    type: String,
    maxlength: [200, 'Address cannot be more than 200 characters'],
  },
  service_area: {
    type: String,
    maxlength: [500, 'Service area cannot be more than 500 characters'],
  },
  city: {
    type: String,
    maxlength: [100, 'City cannot be more than 100 characters'],
  },
  images: [{
    type: String,
  }],
  tags: [{
    type: String,
  }],
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be more than 20 characters'],
  },
  phone_after_hours: {
    type: String,
    maxlength: [20, 'After-hours phone cannot be more than 20 characters'],
  },
  website: {
    type: String,
    maxlength: [200, 'Website cannot be more than 200 characters'],
  },
  email: {
    type: String,
    
    // maxlength: [100, 'Email cannot be more than 100 characters'],
    // match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please add a valid email'],
  },
  twitter: {
    type: String,
    maxlength: [100, 'Twitter handle cannot be more than 100 characters'],
  },
  facebook: {
    type: String,
    maxlength: [100, 'Facebook URL cannot be more than 100 characters'],
  },
  meta_title: {
    type: String,
    maxlength: [150, 'Meta title cannot be more than 150 characters'],
  },
  meta_description: {
    type: String,
    maxlength: [500, 'Meta description cannot be more than 500 characters'],
  },
  verified: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No',
  },
  approved: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
}, { timestamps: true });

export default mongoose.models.Store || mongoose.model('Store', StoreSchema);