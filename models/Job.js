import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  jobName: { type: String, required: true },
  companyName: { type: String, required: true },
  jobDescription: { type: String, required: true },
  jobCategory: { type: String, required: true },
  companyLogo: { type: String, required: true },
  keyResponsibilities: [String],
  skills: [String],
  deadline: { type: Date, required: true },
  salary: { type: String, required: true },
  workDetail: { type: String, required: true },
  location: { type: String, required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: { type: [String], required: true },
  workType: { 
    type: String, 
    enum: ['Office', 'Remote', 'Hybrid'],
    required: true 
  },
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);

export default Job;
