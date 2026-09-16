'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  UserCheck,
  Mail,
  Shield,
  Building2,
  Calendar,
  Phone,
  Home,
  CreditCard,
  FileText,
  User as UserIcon,
  Heart,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [taxId, setTaxId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setPhone(currentUser.phone || '+91 98765 43210');
      setEmergencyContact(currentUser.emergencyContact || 'Spouse: +91 98765 00000');
      setAddress(currentUser.address || 'No. 42, Ambizcon Health Tech Park, Chennai, India');
      setBankAccount(currentUser.bankAccount || 'HDFC Bank • XXXX-XXXX-4821');
      setTaxId(currentUser.taxId || 'ABCDE1234F');
      setBloodGroup(currentUser.bloodGroup || 'O+');
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedUser = {
      ...currentUser,
      phone,
      emergencyContact,
      address,
      bankAccount,
      taxId,
      bloodGroup,
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('ambizcon_user_details_' + currentUser._id, JSON.stringify(updatedUser));
    setIsSaving(false);
    toast.success('Your personal & payroll bank details updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#086075]/15 via-[#2a8c82]/10 to-transparent p-6 glass-panel">
        <div className="flex items-center gap-4">
          <Avatar src={currentUser.avatar} name={currentUser.name} size="xl" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{currentUser.name}</h1>
              <Badge variant="default" className="text-xs bg-emerald-600 text-white font-bold">
                {currentUser.role}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentUser.team} Team
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Personal Employee Profile & Direct Deposit Bank Details
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
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
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Birthday Date</span>
              <span className="text-foreground font-semibold">{currentUser.birthday || '14 Mar'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal & Financial Details Form */}
      <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">My Personal Details & Salary Bank Information</h3>
            <p className="text-xs text-muted-foreground">Keep your emergency contacts and salary bank details updated for HR & Payroll processing.</p>
          </div>
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-[10px]">
            Visible to HR & CEO
          </Badge>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <CreditCard className="h-3.5 w-3.5 text-purple-500" /> Salary Bank Account / BSB / IFSC
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 font-mono focus-ring"
                placeholder="Bank name and account number..."
                required
              />
            </div>

            <div>
              <label className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <FileText className="h-3.5 w-3.5 text-blue-500" /> Tax Identification (PAN / TFN)
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 font-mono focus-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
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
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="submit" disabled={isSaving} className="gap-1.5 ambizcon-gradient text-white shadow-glow">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Personal Details'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
