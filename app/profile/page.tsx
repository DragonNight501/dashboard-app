"use client";

/* ===================== */
/* Profile */
/* Account details, avatar, password and appearance.
*/
/* ===================== */

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Camera, KeyRound, Moon, Pencil, Sun, UserRound } from "lucide-react";
import AuthGuard from "../components/AuthGuard";
import Navbar from "../components/layout/Navbar";
import { supabase } from "../lib/supabase";
import { friendlyError } from "../lib/format";
import { setTheme, useTheme } from "../lib/theme";

const MIN_PASSWORD = 8;
const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type Profile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  createdAt: string;
};

/** Storage path of a public avatar URL, so the old file can be removed. */
function avatarPath(url: string) {
  const marker = "/object/public/avatars/";
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

function Section({ title, description, icon, children }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card rounded-2xl">
      <div className="flex items-start gap-3 border-b border-line px-6 py-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">{icon}</span>
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const theme = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        toast.error(friendlyError(error?.message, "Failed to load profile"));
        return;
      }

      const user = data.user;
      setProfile({
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? "",
        avatarUrl: user.user_metadata?.avatar_url ?? "",
        createdAt: user.created_at,
      });
      setFullName(user.user_metadata?.full_name ?? "");
    }

    void load();
  }, []);

  /* ===================== */
  /* Name */
  /* ===================== */

  async function handleSaveName(event: FormEvent) {
    event.preventDefault();
    const name = fullName.trim();
    if (!name) return toast.error("Name cannot be empty");

    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
    setSavingName(false);

    if (error) return toast.error(friendlyError(error.message, "Failed to save"));

    setProfile((current) => (current ? { ...current, fullName: name } : current));
    setEditingName(false);
    toast.success("Profile updated");
  }

  /* ===================== */
  /* Avatar */
  /* ===================== */

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile) return;

    const extension = AVATAR_TYPES[file.type];
    if (!extension) return toast.error("Use a JPG, PNG, WebP or GIF image");
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be smaller than 2 MB");

    setUploading(true);
    const toastId = toast.loading("Uploading…");
    const path = `${profile.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      contentType: file.type,
    });

    if (uploadError) {
      setUploading(false);
      return toast.error(friendlyError(uploadError.message, "Upload failed"), { id: toastId });
    }

    const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

    if (updateError) {
      await supabase.storage.from("avatars").remove([path]);
      setUploading(false);
      return toast.error(friendlyError(updateError.message, "Could not save the avatar"), { id: toastId });
    }

    // Old avatars used to pile up in storage; remove the previous file.
    const previous = avatarPath(profile.avatarUrl);
    if (previous && previous.startsWith(`${profile.id}/`)) {
      await supabase.storage.from("avatars").remove([previous]);
    }

    setProfile({ ...profile, avatarUrl: publicUrl });
    setUploading(false);
    toast.success("Avatar updated", { id: toastId });
  }

  /* ===================== */
  /* Password */
  /* The current password is now actually verified before changing it.
  */
  /* ===================== */

  async function handlePassword(event: FormEvent) {
    event.preventDefault();
    if (!profile || changingPassword) return;

    if (!currentPassword) return setPasswordError("Enter your current password.");
    if (newPassword.length < MIN_PASSWORD) return setPasswordError(`New password must be at least ${MIN_PASSWORD} characters.`);
    if (newPassword !== confirmPassword) return setPasswordError("New passwords do not match.");
    if (newPassword === currentPassword) return setPasswordError("Choose a password different from the current one.");

    setChangingPassword(true);
    setPasswordError("");

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (verifyError) {
      setChangingPassword(false);
      return setPasswordError(
        /invalid/i.test(verifyError.message) ? "Current password is incorrect." : friendlyError(verifyError.message, "Could not verify your password."),
      );
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) return setPasswordError(friendlyError(error.message, "Could not update the password."));

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }

  const initial = (profile?.fullName || profile?.email || "U").charAt(0).toUpperCase();
  const memberSince = profile
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))
    : "";

  return (
    <AuthGuard>
      <Navbar />

      <main className="relative">
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-72" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-3xl space-y-6 px-4 pt-10 pb-20 sm:px-6">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Profile</h1>
          </div>

          <Section title="Personal details" description="How you appear in the app." icon={<UserRound className="h-4 w-4" />}>
            {!profile ? (
              <div className="h-20 animate-pulse rounded-xl bg-surface-2" />
            ) : (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="relative shrink-0">
                  <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-line bg-surface-2 text-2xl font-semibold text-accent">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      initial
                    )}
                  </div>
                  <label
                    className="absolute -right-2 -bottom-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-line bg-surface text-muted shadow transition hover:text-accent"
                    title="Change avatar"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Change avatar</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={handleAvatar} disabled={uploading} />
                  </label>
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  {editingName ? (
                    <form onSubmit={handleSaveName} className="flex flex-col gap-2 sm:flex-row">
                      <label className="sr-only" htmlFor="full-name">
                        Full name
                      </label>
                      <input
                        id="full-name"
                        className="field"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        maxLength={80}
                        autoFocus
                        disabled={savingName}
                      />
                      <button type="submit" className="btn btn-primary" disabled={savingName}>
                        {savingName ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setFullName(profile.fullName);
                          setEditingName(false);
                        }}
                        disabled={savingName}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="truncate text-lg font-semibold">{profile.fullName || "Unnamed user"}</p>
                      <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditingName(true)} aria-label="Edit name">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-faint">Email</dt>
                      <dd className="mt-0.5 truncate">{profile.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-faint">Member since</dt>
                      <dd className="mt-0.5">{memberSince}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </Section>

          <Section title="Password" description="You need your current password to set a new one." icon={<KeyRound className="h-4 w-4" />}>
            <form onSubmit={handlePassword} className="grid gap-4 sm:grid-cols-2" noValidate>
              {/* Lets password managers associate the form with the account. */}
              <input type="email" autoComplete="username" value={profile?.email ?? ""} readOnly hidden />
              <div className="sm:col-span-2">
                <label className="label" htmlFor="current-password">
                  Current password
                </label>
                <input
                  id="current-password"
                  className="field"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={changingPassword}
                />
              </div>
              <div>
                <label className="label" htmlFor="new-password">
                  New password
                </label>
                <input
                  id="new-password"
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={changingPassword}
                />
              </div>
              <div>
                <label className="label" htmlFor="confirm-password">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={changingPassword}
                />
              </div>

              {passwordError ? (
                <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense sm:col-span-2">
                  {passwordError}
                </p>
              ) : null}

              <div className="sm:col-span-2">
                <button type="submit" className="btn btn-primary" disabled={changingPassword || !profile}>
                  {changingPassword ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          </Section>

          <Section title="Appearance" description="Saved on this device." icon={theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}>
            <div role="radiogroup" aria-label="Theme" className="grid max-w-xs grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2/60 p-1">
              {(["light", "dark"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={theme === option}
                  onClick={() => setTheme(option)}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm capitalize transition ${
                    theme === option ? "bg-surface font-medium text-fg shadow-sm" : "text-muted hover:text-fg"
                  }`}
                >
                  {option === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {option}
                </button>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </AuthGuard>
  );
}
