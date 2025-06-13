import fs from 'fs';
import path from 'path';
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Profile from "../models/Profile.js";

export const applyToJob = async (req, res) => {
  if (req.user.role !== "Applicant") {
    return res.status(403).json({ message: "Only applicants can apply to jobs" });
  }

  const { jobId } = req.params;
  const userId = req.user.userId.toString();

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const now = new Date();
    if (new Date(job.deadline) < now) {
      return res.status(400).json({ message: "Cannot apply. The job application deadline has passed." });
    }

    const existing = await Application.findOne({ job: jobId, applicant: userId });
    if (existing) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    const profile = await Profile.findOne({ userId });

    let resume = req.files?.resume?.[0]?.path || null;

    let isCustomResume = false;
    if (!resume) {
      if (profile && profile.resume) {
        resume = profile.resume;
      } else {
        return res.status(400).json({ message: "Resume not found. Please upload a resume." });
      }
    } else {
      isCustomResume = true;
    }

    const application = new Application({
      job: jobId,
      applicant: userId,
      resume,
      isCustomResume,
    });

    await application.save();

    res.status(201).json({ message: "Application submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const withdrawApplication = async (req, res) => {
  if (req.user.role !== "Applicant") {
    return res.status(403).json({ message: "Only applicants can withdraw applications" });
  }

  const { jobId } = req.params;
  const userId = req.user.userId.toString();

  try {
    const application = await Application.findOne({ job: jobId, applicant: userId });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== 'Pending') {
      return res.status(400).json({ message: "You can only withdraw a 'Pending' application" });
    }

    if (application.isCustomResume && application.resume) {
      const resumePath = path.resolve(application.resume);
      fs.unlink(resumePath, (err) => {
        if (err) {
          console.error("Error deleting resume:", err);
        }
      });
    }

    await Application.findOneAndDelete({ job: jobId, applicant: userId });

    res.status(200).json({ message: "Application withdrawn and resume deleted if it was uploaded separately" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getJobApplications = async (req, res) => {
  if (req.user.role !== "Employer") {
    return res.status(403).json({ message: "Only employers can view applications" });
  }

  const { jobId } = req.params;
  const employerId = req.user.userId.toString();

  try {
    const job = await Job.findOne({ _id: jobId, employer: employerId });

    if (!job) {
      return res.status(403).json({ message: "Unauthorized or job not found" });
    }

    // Step 1: Parse job skills string (if needed)
    let jobSkills = [];
    if (Array.isArray(job.skills) && typeof job.skills[0] === "string") {
      try {
        jobSkills = JSON.parse(job.skills[0]);
      } catch (err) {
        console.error("Failed to parse job skills:", err);
      }
    }

    // Step 2: Normalize job skills
    jobSkills = jobSkills.map(s => s.toLowerCase().trim());

    const applications = await Application.find({ job: jobId })
      .populate("applicant", "-password");

    const applicationsWithMatchedSkills = await Promise.all(
      applications.map(async (application) => {
        const profile = await Profile.findOne({ userId: application.applicant._id });

        let matchedSkills = [];

        if (profile && Array.isArray(profile.skills)) {
          const profileSkills = profile.skills.map(s => s.toLowerCase().trim());
          matchedSkills = jobSkills.filter(skill => profileSkills.includes(skill));
        }

        return {
          ...application.toObject(),
          matchedSkills,
        };
      })
    );

    res.status(200).json(applicationsWithMatchedSkills);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  if (req.user.role !== "Employer") {
    return res
      .status(403)
      .json({ message: "Only employers can update application status" });
  }

  const { applicationId } = req.params;
  const { status } = req.body;

  if (!["Accepted", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res
      .status(200)
      .json({ message: "Application status updated", application });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getUserAppliedJobs = async (req, res) => {
  try {
    const userId = req.user.userId.toString();
    const applications = await Application.find({ applicant: userId })
      .populate({
        path: 'job',
        select: 'jobName companyName location companyLogo'
      })
      .exec();

    const appliedJobs = applications.map(app => ({
      job: app.job,
      status: app.status,
      additionalInfo: app.additionalInfo,
      applicationDate: app.createdAt,
    }));

    res.status(200).json(appliedJobs);
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
