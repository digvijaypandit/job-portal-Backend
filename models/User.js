import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactNumber: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  street: { type: String, required: true },
  pinCode: { type: String, required: true },
  role: { type: String, enum: ['Employer', 'Applicant'], required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
