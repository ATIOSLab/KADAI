"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import {
  Settings,
  Store,
  Users,
  Plus,
  Loader2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { paginateItems } from "@/lib/pagination";

interface StoreData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  taxRate: number;
  receiptFooter: string | null;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  // Store state
  const [loadingStore, setLoadingStore] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: "",
    address: "",
    phone: "",
    taxRate: 0,
    receiptFooter: "",
  });

  // Users state
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  // User dialog state
  const [userDialog, setUserDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    userId?: string;
  }>({ open: false, mode: "add" });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
  });
  const [savingUser, setSavingUser] = useState(false);

  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // ── Fetch Store ──
  const fetchStore = useCallback(async () => {
    setLoadingStore(true);
    try {
      const res = await apiFetch<{ data: StoreData }>("/api/settings/store");
      setStoreForm({
        name: res.data.name || "",
        address: res.data.address || "",
        phone: res.data.phone || "",
        taxRate: res.data.taxRate || 0,
        receiptFooter: res.data.receiptFooter || "",
      });
    } catch {
      toast.error("Gagal memuat konfigurasi toko");
    } finally {
      setLoadingStore(false);
    }
  }, []);

  // ── Fetch Users ──
  const fetchUsers = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoadingUsers(true);
    }
    try {
      const res = await apiFetch<{ data: UserData[] }>("/api/users");
      setUsers(res.data);
    } catch {
      toast.error("Gagal memuat data pengguna");
    } finally {
      if (!options?.silent) {
        setLoadingUsers(false);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchStore();
      void fetchUsers();
    });
  }, [fetchStore, fetchUsers]);

  // ── Save Store ──
  const handleSaveStore = async () => {
    setSavingStore(true);
    try {
      await apiFetch("/api/settings/store", {
        method: "PUT",
        body: {
          name: storeForm.name,
          address: storeForm.address || null,
          phone: storeForm.phone || null,
          taxRate: storeForm.taxRate,
          receiptFooter: storeForm.receiptFooter || null,
        },
      });
      toast.success("Konfigurasi toko berhasil disimpan!");
      fetchStore();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menyimpan konfigurasi";
      toast.error(message);
    } finally {
      setSavingStore(false);
    }
  };

  // ── Open Add User Dialog ──
  const openAddUser = () => {
    setUserForm({ name: "", email: "", password: "", role: "CASHIER" });
    setUserDialog({ open: true, mode: "add" });
  };

  // ── Open Edit User Dialog ──
  const openEditUser = (user: UserData) => {
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setUserDialog({ open: true, mode: "edit", userId: user.id });
  };

  // ── Save User (Create / Update) ──
  const handleSaveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }
    if (userDialog.mode === "add" && !userForm.password) {
      toast.error("Password wajib diisi untuk user baru");
      return;
    }

    setSavingUser(true);
    try {
      if (userDialog.mode === "add") {
        await apiFetch("/api/users", {
          method: "POST",
          body: userForm,
        });
        toast.success("Pengguna berhasil ditambahkan!");
      } else {
        const payload: Record<string, unknown> = {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
        };
        if (userForm.password) payload.password = userForm.password;

        await apiFetch(`/api/users/${userDialog.userId}`, {
          method: "PUT",
          body: payload,
        });
        toast.success("Pengguna berhasil diperbarui!");
      }
      setUserDialog({ open: false, mode: "add" });
      fetchUsers();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menyimpan pengguna";
      toast.error(message);
    } finally {
      setSavingUser(false);
    }
  };

  // ── Delete/Deactivate User ──
  const handleToggleUserStatus = async (user: UserData) => {
    setTogglingUserId(user.id);
    const nextIsActive = !user.isActive;

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.id === user.id
          ? { ...currentUser, isActive: nextIsActive }
          : currentUser
      )
    );

    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: {
          isActive: nextIsActive,
        },
      });
      toast.success(
        `Pengguna "${user.name}" berhasil ${
          user.isActive ? "dinonaktifkan" : "diaktifkan kembali"
        }`
      );
    } catch (err) {
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, isActive: user.isActive }
            : currentUser
        )
      );
      const message =
        err instanceof ApiError
          ? err.message
          : `Gagal ${user.isActive ? "menonaktifkan" : "mengaktifkan"} pengguna`;
      toast.error(message);
    } finally {
      setTogglingUserId(null);
    }
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    MANAGER: "Manager",
    CASHIER: "Kasir",
  };

  const paginatedUsers = paginateItems(users, userPage, userPageSize);

  useEffect(() => {
    setUserPage((current) =>
      Math.min(current, paginatedUsers.pagination.totalPages)
    );
  }, [paginatedUsers.pagination.totalPages]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <PageHeader
        title="Pengaturan"
        description="Kelola konfigurasi toko dan pengguna"
        icon={Settings}
      />

      {/* ═══ Store Settings ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" /> Informasi Toko
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingStore ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Toko</Label>
                  <Input
                    value={storeForm.name}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input
                    value={storeForm.phone}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={storeForm.address}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pajak (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={storeForm.taxRate}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        taxRate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Footer Struk</Label>
                  <Input
                    placeholder="Terima kasih telah berbelanja!"
                    value={storeForm.receiptFooter}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        receiptFooter: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleSaveStore} disabled={savingStore}>
                {savingStore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" /> Simpan Perubahan
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ User Management ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Manajemen Pengguna
            </CardTitle>
            <Button size="sm" onClick={openAddUser}>
              <Plus className="w-4 h-4 mr-1" /> Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="neo-table overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3">Nama</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-center p-3">Role</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-center p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skel-${i}`}>
                      <td className="p-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="p-3 text-center">
                        <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                      </td>
                      <td className="p-3 text-center">
                        <Skeleton className="h-5 w-12 mx-auto rounded-full" />
                      </td>
                      <td className="p-3 text-center">
                        <Skeleton className="h-8 w-16 mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted">
                      Belum ada pengguna
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.data.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-bg-main/50 transition-colors"
                    >
                      <td className="p-3 font-bold">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "default" : "secondary"
                          }
                        >
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={user.isActive ? "success" : "danger"}
                        >
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => openEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={user.isActive}
                            aria-label={`${
                              user.isActive ? "Nonaktifkan" : "Aktifkan"
                            } pengguna ${user.name}`}
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={togglingUserId === user.id}
                            className={`relative inline-flex h-8 w-16 items-center rounded-full border-2 border-black transition-all ${
                              user.isActive
                                ? "bg-accent-success"
                                : "bg-accent-danger"
                            } ${
                              togglingUserId === user.id
                                ? "cursor-not-allowed opacity-70"
                                : "cursor-pointer"
                            }`}
                          >
                            <span
                              className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-[2px_2px_0px_#1A1A1A] transition-all ${
                                user.isActive ? "left-9" : "left-1"
                              }`}
                            >
                              {togglingUserId === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : null}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loadingUsers && users.length > 0 && (
            <TablePagination
              page={paginatedUsers.pagination.page}
              pageSize={paginatedUsers.pagination.limit}
              totalItems={paginatedUsers.pagination.total}
              totalPages={paginatedUsers.pagination.totalPages}
              itemLabel="pengguna"
              className="pt-4"
              onPageChange={setUserPage}
              onPageSizeChange={(nextPageSize) => {
                setUserPageSize(nextPageSize);
                setUserPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* ═══ User Add/Edit Dialog ═══ */}
      <Dialog
        open={userDialog.open}
        onOpenChange={(open) =>
          !open && setUserDialog({ open: false, mode: "add" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userDialog.mode === "add"
                ? "Tambah Pengguna"
                : "Edit Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {userDialog.mode === "add"
                ? "Buat akun baru untuk kasir atau manager."
                : "Ubah detail pengguna. Kosongkan password jika tidak ingin mengubah."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama *</Label>
                  <Input
                    value={userForm.name}
                    onChange={(e) =>
                      setUserForm({ ...userForm, name: e.target.value })
                    }
                    placeholder="Nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    placeholder="user@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Password{" "}
                    {userDialog.mode === "add" ? "*" : ""}
                  </Label>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    placeholder="Min. 6 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <SearchableSelect
                    value={userForm.role}
                    onValueChange={(val) =>
                      setUserForm({ ...userForm, role: val })
                    }
                    placeholder="Pilih role"
                    searchPlaceholder="Cari role..."
                    emptyMessage="Role tidak ditemukan."
                    options={[
                      { value: "ADMIN", label: "Admin" },
                      { value: "MANAGER", label: "Manager" },
                      { value: "CASHIER", label: "Kasir" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserDialog({ open: false, mode: "add" })}
              disabled={savingUser}
            >
              <X className="w-4 h-4 mr-1" /> Batal
            </Button>
            <Button onClick={handleSaveUser} disabled={savingUser}>
              {savingUser ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />{" "}
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" /> Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete User Dialog ═══ */}
    </div>
  );
}
