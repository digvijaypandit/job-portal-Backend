import mongoose from "mongoose";

// Define the Profile schema
const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
    // Applicant-specific fields
    about: {
      type: String,
      required: function () {
        return this.role === "APPLICANT";
      },
    },
    skills: {
      type: [String],
      required: function () {
        return this.role === "APPLICANT";
      },
    },
    education: {
      type: [String],
      required: function () {
        return this.role === "APPLICANT";
      },
    },
    certificates: {
      type: [String],
      required: function () {
        return this.role === "APPLICANT";
      },
    },
    projects: {
      type: [String],
      required: function () {
        return this.role === "APPLICANT";
      },
    },
    socialLinks: {
      LinkedIn: { type: String },
      GitHub: { type: String },
      Portfolio : { type: String }
    },
    resume: {
      type: String,
      required: function () {
        return this.role === "APPLICANT";
      },
    },

    // Employer-specific fields
    companyWebsite: {
      type: String,
      required: function () {
        return this.role === "EMPLOYER";
      },
    },
    companyOverview: {
      type: String,
      required: function () {
        return this.role === "EMPLOYER";
      },
    },
    roleInCompany: {
      type: String,
      required: function () {
        return this.role === "EMPLOYER";
      },
    },
    CompanyLocation: {
      type: String,
      required: function () {
        return this.role === "EMPLOYER";
      },
    },
    Company: {
      type: String,
      required: function () {
        return this.role === "EMPLOYER";
      },
    },

    role: {
      type: String,
      enum: ["APPLICANT", "EMPLOYER"],
      required: true,
    },
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
