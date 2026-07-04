"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  avatar: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function getRoleLabel(role: ProfileData["role"]) {
  if (role === "ADMIN") {
    return "Administrator";
  }

  if (role === "MANAGER") {
    return "Manager";
  }

  return "Kasir";
}

function formatDate(value: string | null, withTime = false) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return withTime ? dateTimeFormatter.format(date) : dateFormatter.format(date);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const initials = useMemo(
    () =>
      profile?.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "US",
    [profile?.name]
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{ data: ProfileData }>("/api/profile");
      setProfile(response.data);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Gagal memuat profil";
      toast.error(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleChangePassword() {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Semua field password wajib diisi");
      return;
    }

    setSavingPassword(true);
    try {
      await apiFetch("/api/profile/password", {
        method: "PUT",
        body: passwordForm,
      });
      toast.success("Password berhasil diperbarui");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Gagal mengubah password akun";
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil"
        description="Kelola informasi akun Anda dan ubah password tanpa perlu masuk ke navigasi utama."
        icon={UserRound}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>
              Ringkasan data akun aktif yang sedang Anda gunakan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={`profile-skeleton-${index}`} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              </>
            ) : profile ? (
              <>
                <div className="flex items-center gap-4 rounded-2xl border border-border-default bg-bg-main/60 p-4">
                  <Avatar className="h-16 w-16 rounded-2xl">
                    {profile.avatar ? (
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                    ) : null}
                    <AvatarFallback className="rounded-2xl text-lg font-black">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-lg font-black">{profile.name}</p>
                    <p className="truncate text-sm font-medium text-text-muted">
                      {profile.email}
                    </p>
                    <Badge
                      variant={profile.isActive ? "success" : "muted"}
                      className="w-fit"
                    >
                      {profile.isActive ? "Akun aktif" : "Akun nonaktif"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-border-default bg-bg-main/40 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Peran
                    </p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-accent-secondary" />
                      <span className="text-sm font-bold">
                        {getRoleLabel(profile.role)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border-default bg-bg-main/40 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Email Login
                    </p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-accent-primary" />
                      <span className="text-sm font-bold">{profile.email}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border-default bg-bg-main/40 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Bergabung
                    </p>
                    <p className="text-sm font-bold">
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-default bg-bg-main/40 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Login Terakhir
                    </p>
                    <p className="text-sm font-bold">
                      {formatDate(profile.lastLoginAt, true)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-default bg-bg-main/40 p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-text-muted">
                      Pembaruan Terakhir
                    </p>
                    <p className="text-sm font-bold">
                      {formatDate(profile.updatedAt, true)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border-default p-6 text-sm font-medium text-text-muted">
                Data profil tidak tersedia saat ini.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Ubah Password</CardTitle>
            <CardDescription>
              Masukkan password saat ini, lalu ganti dengan password baru yang
              lebih aman.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-border-default bg-bg-main/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-warning/15 text-accent-secondary">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black">Keamanan akun</p>
                  <p className="text-sm font-medium text-text-muted">
                    Password baru minimal 6 karakter dan harus berbeda dari
                    password Anda saat ini.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  placeholder="Masukkan password saat ini"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  placeholder="Masukkan password baru"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                }
                disabled={savingPassword}
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Password Baru"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
