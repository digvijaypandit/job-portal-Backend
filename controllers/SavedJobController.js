import SavedJob from "../models/SavedJob.js";

export const saveJob = async (req, res) => {
  const { jobId } = req.body;
  const  userId = req.user.userId.toString();

  try {
    const alreadySaved = await SavedJob.findOne({ user: userId, job: jobId });

    if (alreadySaved) {
      return res.status(400).json({ message: "Job already saved" });
    }

    const savedJob = new SavedJob({ user: userId, job: jobId });
    await savedJob.save();

    res.status(201).json({ message: "Job saved successfully", savedJob });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const removeSavedJob = async (req, res) => {
    const { jobId } = req.body;
    const  userId = req.user.userId.toString();

  try {
    const deleted = await SavedJob.findOneAndDelete({
      user: userId,
      job: jobId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Saved job not found" });
    }

    res.status(200).json({ message: "Saved job removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getSavedJobs = async (req, res) => {
  const  userId = req.user.userId.toString();

  try {
    const savedJobs = await SavedJob.find({ user: userId }).populate("job");

    res.status(200).json(savedJobs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
