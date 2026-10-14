'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Mail,
  Shield,
  Building2,
  Calendar,
  Phone,
  Home,
  User as UserIcon,
  Heart,
  Save,
  GraduationCap,
  Briefcase,
  Plus,
  Trash2,
  MapPin,
  Building,
  Award,
  BookOpen,
  Sparkles,
  Camera,
  Upload,
} from 'lucide-react';
import { EducationRecord, ExperienceRecord } from '@/types';
import { toast } from 'sonner';
import { formatDayMonthOnly } from '@/features/users/UserManagementTable';

import { updateUserProfileSectionAction } from '@/actions/userActions';
import { useCompanyStore } from '@/store/useCompanyStore';
import {
  compressImageFileToDataUrl,
  getCustomUserAvatar,
  removeCustomUserAvatar,
  saveCustomUserAvatar,
} from '@/lib/avatar-store';

export default function ProfilePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isAustralia = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin'
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';

  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [education, setEducation] = useState<EducationRecord[]>([]);
  const [experience, setExperience] = useState<ExperienceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      let savedUser: any = null;
      try {
        const cached = localStorage.getItem('ambizcon_user_details_' + currentUser._id);
        if (cached) {
          savedUser = JSON.parse(cached);
        }
      } catch (e) {
        console.error('Failed to parse cached user profile', e);
      }

      const user = savedUser || currentUser;
      const customAvatar = getCustomUserAvatar({
        userId: currentUser._id,
        email: currentUser.email,
        name: currentUser.name,
        fallbackSrc: user.avatar || currentUser.avatar,
      });

      setAvatarUrl(customAvatar);
      setPhone(user.phone || '+91 98765 43210');
      setEmergencyContact(user.emergencyContact || 'Spouse: +91 98765 00000');
      setAddress(user.address || 'No. 42, Ambizcon Health Tech Park, Chennai, India');
      setBloodGroup(user.bloodGroup || 'O+');

      if (user.education && Array.isArray(user.education) && user.education.length > 0) {
        setEducation(user.education);
      } else {
        setEducation([
          {
            id: 'edu_1',
            degree: 'Bachelor of Technology (B.Tech) - Computer Science',
            institution: 'Anna University, College of Engineering Guindy',
            year: '2018 - 2022',
            area: 'Guindy, Chennai',
            state: 'Tamil Nadu',
            grade: '8.6 CGPA (First Class with Distinction)',
          },
          {
            id: 'edu_2',
            degree: 'Higher Secondary Certificate (HSC / 12th Standard)',
            institution: 'St. Xavier Higher Secondary School',
            year: '2016 - 2018',
            area: 'T. Nagar, Chennai',
            state: 'Tamil Nadu',
            grade: '92.4%',
          },
        ]);
      }

      if (user.experience && Array.isArray(user.experience) && user.experience.length > 0) {
        setExperience(user.experience);
      } else {
        setExperience([
          {
            id: 'exp_1',
            role: currentUser.role === 'Reception Staff' ? 'Front Desk & Operations Executive' : `${currentUser.role || 'Senior Software Engineer'}`,
            company: 'Ambizcon Healthcare Technologies',
            year: '2023 - Present',
            area: 'OMR, Chennai',
            state: 'Tamil Nadu',
            description: 'Leading operational workflows, team task execution, and healthcare client stakeholder coordination.',
          },
          {
            id: 'exp_2',
            role: currentUser.role === 'Reception Staff' ? 'Front Office Guest Coordinator' : 'Associate Systems Engineer',
            company: 'Apollo Global Health Tech',
            year: '2021 - 2023',
            area: 'Greams Road, Chennai',
            state: 'Tamil Nadu',
            description: 'Handled client schedules, reception kiosk operations, and digital documentation records.',
          },
        ]);
      }
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // Profile Picture Upload Handler (Can be uploaded by Team Member, TL, or Admin)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, WEBP)');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 280);
      setAvatarUrl(dataUrl);
      saveCustomUserAvatar(currentUser, dataUrl);

      const updatedUser = {
        ...currentUser,
        avatar: dataUrl,
      };
      setCurrentUser(updatedUser);

      await updateUserProfileSectionAction(currentUser._id, {
        email: currentUser.email,
        name: currentUser.name,
        avatar: dataUrl,
      }).catch(() => {});
      toast.success('Profile picture uploaded! Now displayed in Navbar, Sidebar & Overview.');
    } catch (err) {
      toast.error('Failed to process profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(undefined);
    removeCustomUserAvatar(currentUser);
    const updatedUser = {
      ...currentUser,
      avatar: '',
    };
    setCurrentUser(updatedUser);
    await updateUserProfileSectionAction(currentUser._id, {
      email: currentUser.email,
      name: currentUser.name,
      avatar: '',
    }).catch(() => {});
    toast.info('Custom profile picture removed.');
  };

  // Education Handlers
  const handleAddEducation = () => {
    const newEdu: EducationRecord = {
      id: 'edu_' + Date.now(),
      degree: '',
      institution: '',
      year: '',
      area: '',
      state: '',
      grade: '',
    };
    setEducation((prev) => [...prev, newEdu]);
  };

  const handleUpdateEducation = (index: number, field: keyof EducationRecord, value: string) => {
    setEducation((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    const newExp: ExperienceRecord = {
      id: 'exp_' + Date.now(),
      role: '',
      company: '',
      year: '',
      area: '',
      state: '',
      description: '',
    };
    setExperience((prev) => [...prev, newExp]);
  };

  const handleUpdateExperience = (index: number, field: keyof ExperienceRecord, value: string) => {
    setExperience((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveExperience = (index: number) => {
    setExperience((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const nonSensitiveUpdates = {
      email: currentUser.email,
      name: currentUser.name,
      avatar: avatarUrl,
      phone,
      emergencyContact,
      address,
      bloodGroup,
      education,
      experience,
    };

    try {
      if (avatarUrl) {
        saveCustomUserAvatar(currentUser, avatarUrl);
      }
      const dbUpdated = await updateUserProfileSectionAction(currentUser._id, nonSensitiveUpdates);
      const updatedUser = {
        ...currentUser,
        ...(dbUpdated || nonSensitiveUpdates),
        avatar: avatarUrl || currentUser.avatar,
      };

      setCurrentUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ambizcon_user_details_' + currentUser._id, JSON.stringify(updatedUser));
      }
      toast.success('Your profile picture, details, education & experience saved!');
    } catch (err) {
      toast.error('Failed to save profile updates to database');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header Banner with Direct Profile Picture Upload */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border ambizcon-hero-banner p-6 glass-panel">
        <div className="flex flex-wrap items-center gap-5">
          {/* Interactive Profile Picture Upload Box */}
          <div className="relative group">
            <Avatar
              src={avatarUrl || currentUser.avatar}
              name={currentUser.name}
              userId={currentUser._id}
              email={currentUser.email}
              size="xl"
              className="h-20 w-20 text-2xl ring-4 ring-white/50 dark:ring-zinc-800 shadow-lg"
            />
            <label
              className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Click to upload your profile picture"
            >
              <Camera className="h-5 w-5" />
              <span className="text-[9px] font-bold mt-0.5">Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
            <label
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full ambizcon-gradient text-white shadow-md border-2 border-white dark:border-zinc-900 cursor-pointer hover:scale-110 transition-transform"
              title="Upload Profile Picture"
            >
              <Camera className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{currentUser.name}</h1>
              <Badge variant="default" className="text-xs ambizcon-gradient text-white font-bold">
                {currentUser.role}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentUser.team} Team
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Personal Employee Profile, Profile Picture Upload, Educational Qualifications &amp; Experience
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ambizcon-gradient text-white text-xs font-bold shadow-glow cursor-pointer hover:opacity-95 transition-all">
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Profile Picture'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <Badge variant="outline" className={`text-xs font-mono ${
          isAustralia
            ? 'text-amber-600 dark:text-amber-400 border-amber-500/30'
            : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
        }`}>
          ● Verified Ambizcon Roster
        </Badge>
      </div>

      {/* Account Info Cards */}
      <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
        <h3 className="text-sm font-bold text-foreground pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
          Workspace Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3">
            <Mail className="h-4 w-4 text-emerald-500" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Email</span>
              <span className="font-mono text-foreground font-semibold">{currentUser.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3">
            <Shield className="h-4 w-4 text-purple-500" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Role</span>
              <span className="text-foreground font-semibold">{currentUser.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3">
            <Building2 className="h-4 w-4 text-blue-500" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Team</span>
              <span className="text-foreground font-semibold">{currentUser.team} Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3">
            <Calendar className="h-4 w-4 text-amber-500" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Birthday / DOB</span>
              <span className="text-foreground font-semibold">{formatDayMonthOnly(currentUser.dob || currentUser.birthday || '14 Oct')}</span>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Personal Details Form */}
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Personal Contact & Emergency Information</h3>
              <p className="text-xs text-muted-foreground">Keep your primary contact numbers and emergency details up to date.</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-[10px]">
              Internal Ambizcon HR
            </Badge>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-500" /> Contact Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 focus-ring"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <Heart className="h-3.5 w-3.5 text-rose-500" /> Emergency Contact & Relation
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 focus-ring"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <Home className="h-3.5 w-3.5 text-amber-500" /> Home Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 focus-ring"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <UserIcon className="h-3.5 w-3.5 text-emerald-500" /> Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 focus-ring font-bold"
                >
                  <option value="O+">O Positive (O+)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Educational Qualifications Section */}
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Educational Qualifications</h3>
                <p className="text-xs text-muted-foreground">
                  Degrees, diplomas, school/college names, passing year, city, and state details.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEducation}
              className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Education
            </Button>
          </div>

          {education.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-500/5">
              <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-foreground">No Educational Records Added</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                Add your degrees, colleges, schools, passing years, and locations.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEducation}
                className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Qualification
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-500/5 p-4 relative group"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {edu.degree ? edu.degree : `Qualification #${idx + 1}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(idx)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Remove qualification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <BookOpen className="h-3 w-3 text-emerald-500" /> Degree / Course / Standard *
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                        placeholder="e.g. B.Tech Computer Science / HSC (12th)"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <Building className="h-3 w-3 text-blue-500" /> College or School Name *
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                        placeholder="e.g. Anna University / St. Xavier's"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <Calendar className="h-3 w-3 text-amber-500" /> Passing Year / Duration *
                      </label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => handleUpdateEducation(idx, 'year', e.target.value)}
                        placeholder="e.g. 2018 - 2022 / 2022"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <MapPin className="h-3 w-3 text-rose-500" /> Area / City / Locality *
                      </label>
                      <input
                        type="text"
                        value={edu.area}
                        onChange={(e) => handleUpdateEducation(idx, 'area', e.target.value)}
                        placeholder="e.g. Guindy, Chennai"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <MapPin className="h-3 w-3 text-purple-500" /> State / Region *
                      </label>
                      <input
                        type="text"
                        value={edu.state}
                        onChange={(e) => handleUpdateEducation(idx, 'state', e.target.value)}
                        placeholder="e.g. Tamil Nadu"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <Award className="h-3 w-3 text-emerald-500" /> Grade / Percentage / CGPA
                      </label>
                      <input
                        type="text"
                        value={edu.grade || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'grade', e.target.value)}
                        placeholder="e.g. 8.6 CGPA / 85%"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Professional Experience Section */}
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Professional Experience</h3>
                <p className="text-xs text-muted-foreground">
                  Employment history, company names, job roles, duration, city, and state details.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddExperience}
              className="gap-1.5 text-xs text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Experience
            </Button>
          </div>

          {experience.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-500/5">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-foreground">No Professional Experience Added</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                Add your previous employment records, designations, and companies.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddExperience}
                className="gap-1.5 text-xs text-blue-600 dark:text-blue-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add First Experience
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div
                  key={exp.id || idx}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-500/5 p-4 relative group"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {exp.role && exp.company ? `${exp.role} at ${exp.company}` : `Work Experience #${idx + 1}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(idx)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Remove experience"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-3">
                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <Briefcase className="h-3 w-3 text-blue-500" /> Designation / Job Role *
                      </label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => handleUpdateExperience(idx, 'role', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <Building className="h-3 w-3 text-emerald-500" /> Company Name *
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                        placeholder="e.g. Ambizcon Technologies"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <Calendar className="h-3 w-3 text-amber-500" /> Duration / Years *
                      </label>
                      <input
                        type="text"
                        value={exp.year}
                        onChange={(e) => handleUpdateExperience(idx, 'year', e.target.value)}
                        placeholder="e.g. 2022 - Present / 2020 - 2022"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <MapPin className="h-3 w-3 text-rose-500" /> Area / City / Locality *
                      </label>
                      <input
                        type="text"
                        value={exp.area}
                        onChange={(e) => handleUpdateExperience(idx, 'area', e.target.value)}
                        placeholder="e.g. OMR, Chennai"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-2">
                      <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                        <MapPin className="h-3 w-3 text-purple-500" /> State / Region *
                      </label>
                      <input
                        type="text"
                        value={exp.state}
                        onChange={(e) => handleUpdateExperience(idx, 'state', e.target.value)}
                        placeholder="e.g. Tamil Nadu"
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 focus-ring text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground flex items-center gap-1 mb-1 text-[11px]">
                      <Sparkles className="h-3 w-3 text-amber-500" /> Key Responsibilities / Description
                    </label>
                    <textarea
                      rows={2}
                      value={exp.description || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                      placeholder="Briefly describe your key role highlights, deliverables, or projects..."
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 focus-ring text-xs resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Action Save Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-500/5">
          <p className="text-xs text-muted-foreground">
            All updates to personal details, educational qualifications, and professional experience will be saved to your employee profile.
          </p>
          <Button
            type="submit"
            disabled={isSaving}
            className="gap-2 ambizcon-gradient text-white shadow-glow px-6 py-2 text-xs font-semibold"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving Profile...' : 'Save Profile & Career Details'}
          </Button>
        </div>
      </form>
    </div>
  );
}
