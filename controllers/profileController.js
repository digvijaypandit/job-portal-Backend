import Profile from '../models/Profile.js';
import User from '../models/user.js';
import fs from 'fs';

// Get Profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await Profile.findOne({ userId }).populate('userId', 'firstName lastName email contactNumber');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteFile = (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete file: ${filePath}`, err);
    } else {
      console.log(`Deleted file: ${filePath}`);
    }
  });
};

// Create Profile
const createProfile = async (req, res) => {
  const {
    about, skills, education,
    certificates, projects, socialLinks,
    companyWebsite, companyOverview, roleInCompany, Company, CompanyLocation
  } = req.body;

  console.log(req.body)

  const userId = req.user.userId;
  const role = req.user.role.toUpperCase();
  const photo = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
  const resume = req.files?.resume?.[0]?.filename ? `/uploads/${req.files.resume[0].filename}` : null;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profileData = {
      userId,
      photo,
      role,
    };

    if (role === 'APPLICANT') {
      profileData.about = about;
      profileData.skills = JSON.parse(skills || '[]');
      profileData.education = JSON.parse(education || '[]');
      profileData.certificates = JSON.parse(certificates || '[]');
      profileData.projects = JSON.parse(projects || '[]');
      profileData.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      profileData.resume = resume;
    } else if (role === 'EMPLOYER') {
      profileData.companyWebsite = companyWebsite;
      profileData.companyOverview = companyOverview;
      profileData.roleInCompany = roleInCompany;
      profileData.Company = Company;
      profileData.CompanyLocation = CompanyLocation;
    }

    const newProfile = new Profile(profileData);
    await newProfile.save();

    res.status(201).json(newProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  const {
    about, skills, education, certificates,
    projects, socialLinks, companyWebsite,
    companyOverview, roleInCompany, Company, CompanyLocation
  } = req.body;

  console.log(req.body)
  const newPhoto = req.files?.photo?.[0]?.filename ? `/uploads/${req.files.photo[0].filename}` : null;
  const newResume = req.files?.resume?.[0]?.filename ? `/uploads/${req.files.resume[0].filename}` : null;

  try {
    const userId = req.user.userId;
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (newPhoto && profile.photo) {
      deleteFile(profile.photo);
      profile.photo = newPhoto;
    }

    if (newResume && profile.resume) {
      deleteFile(profile.resume);
      profile.resume = newResume;
    }

    if (profile.role === 'APPLICANT') {
      profile.about = about || profile.about;
      profile.skills = skills ? JSON.parse(skills) : profile.skills;
      profile.education = education ? JSON.parse(education) : profile.education;
      profile.certificates = certificates ? JSON.parse(certificates) : profile.certificates;
      profile.projects = projects ? JSON.parse(projects) : profile.projects;
      profile.socialLinks = socialLinks ? (typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks) : profile.socialLinks;
    } else if (profile.role === 'EMPLOYER') {
      profile.companyWebsite = companyWebsite || profile.companyWebsite;
      profile.companyOverview = companyOverview || profile.companyOverview;
      profile.roleInCompany = roleInCompany || profile.roleInCompany;
      profile.roleInCompany = Company || profile.Company;
      profile.roleInCompany = CompanyLocation || profile.CompanyLocation;
    }

    await profile.save();
    res.json(profile); // return updated profile
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export { getProfile, updateProfile, createProfile };