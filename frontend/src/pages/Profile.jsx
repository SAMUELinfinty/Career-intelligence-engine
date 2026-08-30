import React, { useState, useEffect } from 'react';
import {
  User,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Target,
  Sliders
} from 'lucide-react';
import { fetchProfile, updateProfile, fetchSkills } from '../services/api';
import './Profile.css';

const PROFICIENCY_LABELS = {
  0: 'None / Learning',
  1: 'Beginner (1/4)',
  2: 'Intermediate (2/4)',
  3: 'Advanced (3/4)',
  4: 'Expert (4/4)',
};

const ALL_TARGET_ROLES = [
  'Software Engineering',
  'Data & AI',
  'Cloud & DevOps',
  'Cybersecurity',
  'GRC',
  'Web Development',
];

export default function Profile() {
  const [name, setName] = useState('');
  const [skills, setSkills] = useState([]);
  const [targetRoles, setTargetRoles] = useState([]);

  const [allAvailableSkills, setAllAvailableSkills] = useState([]);
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load profile and all canonical skills
  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, skillsRes] = await Promise.all([
        fetchProfile(),
        fetchSkills(),
      ]);

      if (profRes) {
        setName(profRes.name || '');
        setSkills(profRes.skills || []);
        setTargetRoles(profRes.targetRoles || []);
      }

      if (skillsRes && skillsRes.skills) {
        setAllAvailableSkills(skillsRes.skills);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleProficiencyChange = (skillName, newProf) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.name === skillName ? { ...s, proficiency: parseInt(newProf, 10) } : s
      )
    );
  };

  const handleRemoveSkill = (skillName) => {
    setSkills((prev) => prev.filter((s) => s.name !== skillName));
  };

  const handleAddSkill = () => {
    if (!selectedSkillToAdd) return;
    if (skills.some((s) => s.name === selectedSkillToAdd)) {
      setError(`"${selectedSkillToAdd}" is already in your skills list.`);
      return;
    }
    setSkills((prev) => [...prev, { name: selectedSkillToAdd, proficiency: 3 }]);
    setSelectedSkillToAdd('');
    setError(null);
  };

  const handleTargetRoleToggle = (roleName) => {
    setTargetRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateProfile({
        name: name.trim(),
        skills: skills.map((s) => ({ name: s.name, proficiency: s.proficiency })),
        targetRoles,
      });

      setName(updated.name);
      setSkills(updated.skills);
      setTargetRoles(updated.targetRoles);
      setSuccessMessage('Profile successfully updated! Matches re-calculated.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="skeleton" style={{ height: '150px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: '300px' }} />
      </div>
    );
  }

  // Filter skills not yet in user profile
  const remainingSkills = allAvailableSkills.filter(
    (sk) => !skills.some((s) => s.name === sk.name)
  );

  return (
    <div className="app-container">
      <div className="profile-header">
        <div>
          <h1>My Skill Profile</h1>
          <p className="subtitle">
            Manage your technical skills, proficiency levels, and target role categories.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle2 size={20} />
          <div>{successMessage}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="profile-form">
        {/* User Name Section */}
        <div className="card profile-card">
          <div className="card-header-icon">
            <User size={20} className="icon-primary" />
            <h3>User Information</h3>
          </div>
          <div className="form-group" style={{ maxWidth: '400px', margin: 0 }}>
            <label htmlFor="user-name">Candidate Full Name</label>
            <input
              id="user-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Samuel Infinity"
              required
            />
          </div>
        </div>

        {/* Target Roles Section */}
        <div className="card profile-card">
          <div className="card-header-icon">
            <Target size={20} className="icon-primary" />
            <h3>Target Career Roles</h3>
          </div>
          <p className="section-desc">
            Select the technical domains you are targeting. Recommendations and matching weight will prioritize these categories.
          </p>
          <div className="target-roles-grid">
            {ALL_TARGET_ROLES.map((role) => {
              const isChecked = targetRoles.includes(role);
              return (
                <label
                  key={role}
                  className={`role-checkbox-card ${isChecked ? 'role-checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleTargetRoleToggle(role)}
                  />
                  <span>{role}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Technical Skills & Proficiency */}
        <div className="card profile-card">
          <div className="card-header-icon">
            <Cpu size={20} className="icon-primary" />
            <h3>Technical Skill Profile ({skills.length})</h3>
          </div>

          {/* Add Skill Bar */}
          <div className="add-skill-row">
            <select
              className="select"
              value={selectedSkillToAdd}
              onChange={(e) => setSelectedSkillToAdd(e.target.value)}
            >
              <option value="">-- Select a skill to add --</option>
              {remainingSkills.map((sk) => (
                <option key={sk.id} value={sk.name}>
                  {sk.name} ({sk.category})
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddSkill}
              disabled={!selectedSkillToAdd}
            >
              <Plus size={16} />
              <span>Add Skill</span>
            </button>
          </div>

          {/* Skills List with Proficiency Sliders */}
          <div className="skills-table-wrapper">
            <div className="skills-list-grid">
              {skills.map((s) => (
                <div key={s.name} className="skill-edit-row">
                  <div className="skill-edit-name">
                    <strong>{s.name}</strong>
                  </div>

                  <div className="skill-edit-slider">
                    <div className="slider-header">
                      <Sliders size={14} />
                      <span>{PROFICIENCY_LABELS[s.proficiency]}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={s.proficiency}
                      onChange={(e) => handleProficiencyChange(s.name, e.target.value)}
                      className="proficiency-range"
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-icon-delete"
                    onClick={() => handleRemoveSkill(s.name)}
                    title="Remove skill"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="profile-save-bar">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
