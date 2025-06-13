import fs from "fs/promises";
import path from "path";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Profile from "../models/Profile.js";

// Create a new job (employer only)
export const createJob = async (req, res) => {
  const {
    jobName,
    companyName,
    jobDescription,
    jobCategory,
    keyResponsibilities,
    skills,
    deadline,
    salary,
    workDetail,
    location,
    tags,
    workType,
  } = req.body;

  const companyLogo = req.file ? `/uploads/${req.file.filename}` : null;
  if (
    !jobName ||
    !companyName ||
    !jobDescription ||
    !jobCategory ||
    !req.file ||
    !deadline ||
    !salary ||
    !workDetail ||
    !location ||
    !tags ||
    !workType
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if the workType is valid
  if (!["Office", "Remote", "Hybrid"].includes(workType)) {
    return res.status(400).json({
      message: "Invalid workType. Choose between Office, Remote, or Hybrid.",
    });
  }

  try {
    const job = new Job({
      jobName,
      companyName,
      jobDescription,
      jobCategory,
      companyLogo,
      keyResponsibilities,
      skills,
      deadline,
      salary,
      workDetail,
      location,
      tags,
      workType,
      employer: req.user.userId,
    });

    await job.save();
    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    res.status(500).json({ message: "Error creating job", error });
  }
};

export const updateJob = async (req, res) => {
  const { jobId } = req.params;
  const employerId = req.user.userId.toString();
  const {
    jobName,
    companyName,
    jobDescription,
    jobCategory,
    keyResponsibilities,
    skills,
    deadline,
    salary,
    workDetail,
    location,
    tags,
    workType,
  } = req.body;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.employer.toString() !== employerId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this job" });
    }

    job.jobName = jobName || job.jobName;
    job.companyName = companyName || job.companyName;
    job.jobDescription = jobDescription || job.jobDescription;
    job.jobCategory = jobCategory || job.jobCategory;
    job.keyResponsibilities = keyResponsibilities || job.keyResponsibilities;
    job.skills = skills || job.skills;
    job.deadline = deadline || job.deadline;
    job.salary = salary || job.salary;
    job.workDetail = workDetail || job.workDetail;
    job.location = location || job.location;
    job.tags = tags || job.tags;
    job.workType = workType || job.workType;

    await job.save();
    res.status(200).json({ message: "Job updated successfully", job });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Error updating job", error });
  }
};

export const deleteJob = async (req, res) => {
  const { jobId } = req.params;
  const employerId = req.user.userId.toString();

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.employer.toString() !== employerId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this job" });
    }

    if (job.companyLogo) {
      try {
        const logoPath = path.resolve("public", job.companyLogo);
        await fs.unlink(logoPath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          console.error("Error deleting logo:", err);
        }
      }
    }

    const applications = await Application.find({ job: jobId });

    for (const application of applications) {
      if (application.resume) {
        try {
          const resumePath = path.resolve("public", application.resume);
          await fs.unlink(resumePath);
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error("Error deleting resume:", err);
          }
        }
      }
      await Application.findByIdAndDelete(application._id);
    }

    await Job.findByIdAndDelete(jobId);

    res.status(200).json({
      message: "Job, logo, resumes, and applications deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Error deleting job", error });
  }
};

export const getJobsByEmployerId = async (req, res) => {
  const { employerId } = req.params;

  try {
    const jobs = await Job.find({ employer: employerId });

    if (jobs.length === 0) {
      return res
        .status(404)
        .json({ message: "No jobs found for this employer" });
    }

    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error retrieving jobs by employer ID:", error);
    res
      .status(500)
      .json({ message: "Error retrieving jobs by employer ID", error });
  }
};

export const findJobs = async (req, res) => {
  const { category, jobName } = req.query;

  const filter = [];

  if (category) {
    filter.push({ jobCategory: category });
  }

  if (jobName) {
    const words = jobName.trim().split(/\s+/);
    const regexQueries = words.map((word) => ({
      jobName: { $regex: word, $options: "i" },
    }));
    filter.push({ $or: regexQueries });
  }

  try {
    const jobs = await Job.find(
      filter.length ? { $and: filter } : {},
      "jobName companyName companyLogo location salary jobCategory deadline tags workType createdAt updatedAt"
    );

    if (jobs.length === 0) {
      return res
        .status(404)
        .json({ message: "No jobs found matching the criteria" });
    }

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: "Error finding jobs", error });
  }
};

export const findJobsByApplicantProfile = async (req, res) => {
  try {
    const { userId } = req.user; // Comes from auth middleware

    // 1. Fetch profile
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.role !== "APPLICANT") {
      return res.status(403).json({ message: "Only applicants can receive job recommendations" });
    }

    // 2. Build job filters from profile data
    const filter = [];

    if (profile.skills?.length) {
      const skillQueries = profile.skills.map(skill => ({
        skills: { $regex: skill, $options: "i" },
      }));
      filter.push({ $or: skillQueries });
    }

    const jobs = await Job.find(
      filter.length ? { $and: filter } : {},
      "jobName companyName companyLogo location salary jobCategory deadline tags workType createdAt updatedAt"
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "No matching jobs found" });
    }

    // 3. Add applicant count for each job
    const jobsWithApplicantCount = await Promise.all(jobs.map(async job => {
      const applicantCount = await Application.countDocuments({ job: job._id });
      return {
        ...job.toObject(),
        applicantCount,
      };
    }));

    res.status(200).json({ jobs: jobsWithApplicantCount });

  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    // 2. Find job and populate employer if needed
    const job = await Job.findById(id).populate('employer', '-password -__v');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 3. Count number of applicants for this job
    const applicantCount = await Application.countDocuments({ job: id });

    // 4. Send job + applicant count
    res.status(200).json({
      ...job.toObject(),
      applicantCount,
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
