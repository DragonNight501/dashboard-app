"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";
import LogoutButton from "../components/LogoutButton";
import ThemeToggle from "../components/ThemeToggle";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

type UserProfile = {
    id: string;
    email: string;
    fullName: string;
};

export default function ProfilePage() {
    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState("");
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState("Light");

    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState("");
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);

            try {
                const { data, error } = await supabase.auth.getUser();

                if (error || !data.user) return;

                const currentUser = data.user;

                const savedTheme = localStorage.getItem("theme");
                setTheme(savedTheme === "dark" ? "Dark" : "Light");

                const profileData = {
                    id: currentUser.id,
                    email: currentUser.email || "No email",
                    fullName: currentUser.user_metadata?.full_name || "",
                };

                setUser(profileData);
                setFullName(profileData.fullName);
                setAvatarUrl(currentUser.user_metadata?.avatar_url || "");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleSaveProfile = async () => {
        if (saving) return;

        setSaving(true);
        const loadingToast = toast.loading("Saving profile...");

        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: fullName,
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
                    fullName,
                }
                : prev
        );

        setIsEditing(false);
        toast.success("Profile updated successfully");
    };

    const handleCancelEdit = () => {
        setFullName(user?.fullName || "");
        setIsEditing(false);
    };
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please choose an image file");
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

        const user = userData.user;
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

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
    };
    const handleChangePassword = async () => {
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
    };

    return (
        <AuthGuard>
            <main style={{ padding: "2rem" }}>
                <div className="profileTopBar">
                    <h2>Profile</h2>

                    <div className="profileActions">
                        <button className="backBtn" onClick={() => router.push("/")}>
                            ← Dashboard
                        </button>
                        <ThemeToggle />
                        <LogoutButton />
                    </div>
                </div>

                <div className="profileCard">
                    {loading ? (
                        <div className="profileLoading">Loading profile...</div>
                    ) : (
                        <>
                            <div className="profileHeader">

                                <div className="profileAvatar">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="profileAvatarImage" />
                                    ) : (
                                        (user?.fullName?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()
                                    )}
                                </div>


                                <div>
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


                            <div className="profileGrid">
                                <div className="profileInfoBox">
                                    <span className="profileLabel">Full Name</span>

                                    {isEditing ? (
                                        <input
                                            className="profileInput"
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
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

                            <div className="profileButtons">
                                {!isEditing ? (
                                    <button className="saveBtn" onClick={() => setIsEditing(true)}>
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
                            <div className="passwordSection">
                                <h3>Change Password</h3>

                                <div className="passwordGrid">
                                    <input
                                        className="profileInput"
                                        type="password"
                                        placeholder="Current password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        disabled={passwordLoading}
                                    />

                                    <input
                                        className="profileInput"
                                        type="password"
                                        placeholder="New password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={passwordLoading}
                                    />

                                    <input
                                        className="profileInput fullInput"
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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