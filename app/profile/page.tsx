"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";
import LogoutButton from "../components/LogoutButton";
import ThemeToggle from "../components/ThemeToggle";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

/* ===================== */
/* Types */
/* ===================== */

type UserProfile = {
  id: string;
  email: string;
  fullName: string;
};

/* ===================== */
/* Profile Page */
/* Allows users to view and update profile data, avatar, and password.
 */
/* ===================== */

export default function ProfilePage() {
  const router = useRouter();

  /* ===================== */
  /* Profile State */
  /* ===================== */

  const [user, setUser] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [theme, setTheme] = useState("Light");
  const [loading, setLoading] = useState(true);

  /* ===================== */
  /* Edit Profile State */
  /* ===================== */

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  /* ===================== */
  /* Avatar State */
  /* ===================== */

  const [avatarLoading, setAvatarLoading] = useState(false);

  /* ===================== */
  /* Password State */
  /* ===================== */

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  /* ===================== */
  /* Fetch User Profile */
  /* Loads authenticated user data and local theme preference.
   */
  /* ===================== */

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          toast.error("Failed to load profile");
          return;
        }

        const currentUser = data.user;
        const savedTheme = localStorage.getItem("theme");

        const profileData: UserProfile = {
          id: currentUser.id,
          email: currentUser.email || "No email",
          fullName: currentUser.user_metadata?.full_name || "",
        };

        setTheme(savedTheme === "dark" ? "Dark" : "Light");
        setUser(profileData);
        setFullName(profileData.fullName);
        setAvatarUrl(currentUser.user_metadata?.avatar_url || "");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  /* ===================== */
  /* Save Profile */
  /* Updates the user's public profile metadata.
   */
  /* ===================== */

  async function handleSaveProfile() {
    if (saving) return;

    if (!fullName.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading("Saving profile...");

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
      },
    });

    toast.dismiss(loadingToast);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setUser((prev) =>
      prev
        ? {
            ...prev,
            fullName: fullName.trim(),
          }
        : prev,
    );

    setIsEditing(false);
    toast.success("Profile updated successfully");
  }

  /* ===================== */
  /* Cancel Profile Edit */
  /* Restores the original full name.
   */
  /* ===================== */

  function handleCancelEdit() {
    setFullName(user?.fullName || "");
    setIsEditing(false);
  }

  /* ===================== */
  /* Avatar Upload */
  /* Uploads avatar image to Supabase Storage and saves its public URL.
   */
  /* ===================== */

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    setAvatarLoading(true);
    const loadingToast = toast.loading("Uploading avatar...");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      toast.dismiss(loadingToast);
      toast.error("User not found");
      setAvatarLoading(false);
      return;
    }

    const currentUser = userData.user;
    const fileExt = file.name.split(".").pop();
    const filePath = `${currentUser.id}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      toast.dismiss(loadingToast);
      toast.error(uploadError.message);
      setAvatarLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: publicUrl,
      },
    });

    toast.dismiss(loadingToast);
    setAvatarLoading(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setAvatarUrl(publicUrl);
    toast.success("Avatar updated successfully");
  }

  /* ===================== */
  /* Change Password */
  /* Updates the authenticated user's password.
   */
  /* ===================== */

  async function handleChangePassword() {
    if (passwordLoading) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setPasswordLoading(true);
    const loadingToast = toast.loading("Updating password...");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    toast.dismiss(loadingToast);
    setPasswordLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated successfully");
  }

  /* ===================== */
  /* UI Rendering */
  /* ===================== */

  return (
    <AuthGuard>
      <main className="profilePage">
        {/* ===================== */}
        {/* Profile Top Bar */}
        {/* ===================== */}

        <div className="profileTopBar">
          <div>
            <h2>Profile</h2>
            <p className="sectionDescription">
              Manage your account information, avatar, and security settings.
            </p>
          </div>

          <div className="profileActions">
            <button className="backBtn" onClick={() => router.push("/")}>
              ← Dashboard
            </button>

            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        {/* ===================== */}
        {/* Profile Card */}
        {/* ===================== */}

        <div className="profileCard">
          {loading ? (
            <div className="profileLoading">Loading profile...</div>
          ) : (
            <>
              {/* ===================== */}
              {/* Profile Header */}
              {/* ===================== */}

              <div className="profileHeader">
                <div className="profileAvatar">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="User avatar"
                      className="profileAvatarImage"
                    />
                  ) : (
                    (
                      user?.fullName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"
                    ).toUpperCase()
                  )}
                </div>

                <div className="profileIdentity">
                  <h3>{user?.fullName || "Unnamed User"}</h3>
                  <p>{user?.email}</p>
                </div>

                <div className="avatarUploadRow">
                  <label className="uploadBtn">
                    {avatarLoading ? "Uploading..." : "Upload Avatar"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      hidden
                      disabled={avatarLoading}
                    />
                  </label>
                </div>
              </div>

              {/* ===================== */}
              {/* Profile Information */}
              {/* ===================== */}

              <div className="profileGrid">
                <div className="profileInfoBox">
                  <span className="profileLabel">Full Name</span>

                  {isEditing ? (
                    <input
                      className="profileInput"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      disabled={saving}
                    />
                  ) : (
                    <span className="profileValue">
                      {user?.fullName || "Not set yet"}
                    </span>
                  )}
                </div>

                <div className="profileInfoBox">
                  <span className="profileLabel">Email</span>
                  <span className="profileValue">{user?.email}</span>
                </div>

                <div className="profileInfoBox">
                  <span className="profileLabel">Theme</span>
                  <span className="profileValue">{theme}</span>
                </div>

                <div className="profileInfoBox fullWidth">
                  <span className="profileLabel">User ID</span>
                  <span className="profileValue smallText">{user?.id}</span>
                </div>
              </div>

              {/* ===================== */}
              {/* Profile Actions */}
              {/* ===================== */}

              <div className="profileButtons">
                {!isEditing ? (
                  <button
                    className="saveBtn"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      className="saveBtn"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      className="cancelBtn"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>

              {/* ===================== */}
              {/* Password Section */}
              {/* ===================== */}

              <div className="passwordSection">
                <h3>Change Password</h3>

                <div className="passwordGrid">
                  <input
                    className="profileInput"
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    disabled={passwordLoading}
                  />

                  <input
                    className="profileInput"
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={passwordLoading}
                  />

                  <input
                    className="profileInput fullInput"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={passwordLoading}
                  />
                </div>

                <div className="profileButtons">
                  <button
                    className="saveBtn"
                    onClick={handleChangePassword}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
