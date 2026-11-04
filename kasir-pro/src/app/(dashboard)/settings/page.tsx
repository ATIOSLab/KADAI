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
  Bot,
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
  taxType: string;
  taxRate: number;
  taxInclusive: boolean;
  serviceChargeRate: number;
  enableRounding: boolean;
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

interface BotSettingsData {
  id: string;
  enabled: boolean;
  timezone: string;
  closingTimeLocal: string;
  summaryEnabled: boolean;
  businessDayMode: "CLOSING_CUTOFF";
  hasOpenAiApiKey: boolean;
  hasTelegramBotToken: boolean;
}

interface TelegramChatBindingData {
  id: string;
  telegramChatId: string;
  chatType: string;
  title: string | null;
  username: string | null;
  isAuthorized: boolean;
  canReceiveSummary: boolean;
  lastSeenAt: string | null;
}

export default function SettingsPage() {
  // Store state
  const [loadingStore, setLoadingStore] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({
    name: "",
    address: "",
    phone: "",
    taxType: "PB1_10",
    taxRate: 10,
    taxInclusive: false,
    serviceChargeRate: 5,
    enableRounding: true,
  });

  const [loadingBot, setLoadingBot] = useState(true);
  const [savingBot, setSavingBot] = useState(false);
  const [botForm, setBotForm] = useState({
    enabled: false,
    timezone: "Asia/Jakarta",
    closingTimeLocal: "22:00",
    summaryEnabled: false,
    businessDayMode: "CLOSING_CUTOFF" as const,
  });
  const [botSecrets, setBotSecrets] = useState({
    openaiApiKey: "",
    telegramBotToken: "",
  });
  const [botSecretStatus, setBotSecretStatus] = useState({
    hasOpenAiApiKey: false,
    hasTelegramBotToken: false,
  });
  const [botChats, setBotChats] = useState<TelegramChatBindingData[]>([]);

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
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    supervisorPin: string;
  }>({
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
    supervisorPin: "",
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
        taxType: res.data.taxType || "PB1_10",
        taxRate: res.data.taxRate ?? 10,
        taxInclusive: Boolean(res.data.taxInclusive),
        serviceChargeRate: res.data.serviceChargeRate ?? 5,
        enableRounding: Boolean(res.data.enableRounding),
      });
    } catch {
      toast.error("Gagal memuat konfigurasi toko");
    } finally {
      setLoadingStore(false);
    }
  }, []);

  const fetchBot = useCallback(async () => {
    setLoadingBot(true);
    try {
      const res = await apiFetch<{
        data: {
          settings: BotSettingsData;
          chats: TelegramChatBindingData[];
        };
      }>("/api/settings/bot");
      setBotForm({
        enabled: res.data.settings.enabled,
        timezone: res.data.settings.timezone,
        closingTimeLocal: res.data.settings.closingTimeLocal,
        summaryEnabled: res.data.settings.summaryEnabled,
        businessDayMode: res.data.settings.businessDayMode,
      });
      setBotSecretStatus({
        hasOpenAiApiKey: res.data.settings.hasOpenAiApiKey,
        hasTelegramBotToken: res.data.settings.hasTelegramBotToken,
      });
      setBotSecrets({
        openaiApiKey: "",
        telegramBotToken: "",
      });
      setBotChats(res.data.chats);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal memuat pengaturan bot";
      toast.error(message);
    } finally {
      setLoadingBot(false);
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
      void fetchBot();
      void fetchUsers();
    });
  }, [fetchBot, fetchStore, fetchUsers]);

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
          taxType: storeForm.taxType,
          taxRate: storeForm.taxRate,
          taxInclusive: storeForm.taxInclusive,
          serviceChargeRate: storeForm.serviceChargeRate,
          enableRounding: storeForm.enableRounding,
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

  const handleSaveBot = async () => {
    setSavingBot(true);
    try {
      const response = await apiFetch<{
        success: boolean;
        warning?: string | null;
      }>("/api/settings/bot", {
        method: "PUT",
        body: {
          ...botForm,
          openaiApiKey: botSecrets.openaiApiKey,
          telegramBotToken: botSecrets.telegramBotToken,
          chats: botChats.map((chat) => ({
            id: chat.id,
            isAuthorized: chat.isAuthorized,
            canReceiveSummary: chat.canReceiveSummary,
          })),
        },
      });
      toast.success("Pengaturan bot berhasil disimpan!");
      if (response.warning) {
        toast.warning(response.warning);
      }
      void fetchBot();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menyimpan pengaturan bot";
      toast.error(message);
    } finally {
      setSavingBot(false);
    }
  };

  const handleToggleChatAuthorization = (chatId: string) => {
    setBotChats((currentChats) =>
      currentChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              isAuthorized: !chat.isAuthorized,
              canReceiveSummary: chat.isAuthorized ? false : chat.canReceiveSummary,
            }
          : chat
      )
    );
  };

  const handleSelectSummaryChat = (chatId: string) => {
    setBotChats((currentChats) =>
      currentChats.map((chat) => ({
        ...chat,
        canReceiveSummary: chat.id === chatId ? !chat.canReceiveSummary : false,
        isAuthorized: chat.id === chatId ? true : chat.isAuthorized,
      }))
    );
  };

  // ── Open Add User Dialog ──
  const openAddUser = () => {
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "CASHIER",
      supervisorPin: "",
    });
    setUserDialog({ open: true, mode: "add" });
  };

  // ── Open Edit User Dialog ──
  const openEditUser = (user: UserData) => {
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      supervisorPin: "",
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
          body: {
            ...userForm,
            supervisorPin: userForm.supervisorPin || undefined,
          },
        });
        toast.success("Pengguna berhasil ditambahkan!");
      } else {
        const payload: Record<string, unknown> = {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
        };
        if (userForm.password) payload.password = userForm.password;
        if (userForm.supervisorPin) payload.supervisorPin = userForm.supervisorPin;

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
    ADMIN: "Pemilik Toko (Admin)",
    MANAGER: "Manager Cabang",
    CASHIER: "Kasir POS",
    KITCHEN: "Dapur & Bar (KDS)",
    INVENTORY: "Staf Gudang & Stok",
    ACCOUNTANT: "Akuntan SAK EMKM",
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
        description="Kelola konfigurasi toko, bot, dan pengguna"
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
                  <Label>Tipe Pajak Usaha</Label>
                  <select
                    value={storeForm.taxType}
                    onChange={(e: any) =>
                      setStoreForm({ ...storeForm, taxType: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg neo-border bg-card text-xs font-bold"
                  >
                    <option value="PB1_10">PB1 - Pajak Restoran / Kuliner (10%)</option>
                    <option value="PPN_11">PPN - Pajak Pertambahan Nilai (11%)</option>
                    <option value="PPN_12">PPN - Tarif 12%</option>
                    <option value="NONE">Tanpa Pajak / Non-PKP (0%)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tarif Pajak Efektif (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={storeForm.taxRate}
                    onChange={(e: any) =>
                      setStoreForm({
                        ...storeForm,
                        taxRate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Biaya Layanan / Service Charge (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={storeForm.serviceChargeRate}
                    onChange={(e: any) =>
                      setStoreForm({
                        ...storeForm,
                        serviceChargeRate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col justify-center space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={storeForm.enableRounding}
                      onChange={(e: any) =>
                        setStoreForm({
                          ...storeForm,
                          enableRounding: e.target.checked,
                        })
                      }
                      className="size-4 rounded"
                    />
                    Pembulatan Kasir Otomatis (ke Rp 100 terdekat)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={storeForm.taxInclusive}
                      onChange={(e: any) =>
                        setStoreForm({
                          ...storeForm,
                          taxInclusive: e.target.checked,
                        })
                      }
                      className="size-4 rounded"
                    />
                    Harga Jual Sudah Termasuk Pajak (Inklusif DPP)
                  </label>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" /> Telegram Sales Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadingBot ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status Bot</Label>
                  <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-bg-main px-4 py-3">
                    <div>
                      <p className="font-bold">
                        {botForm.enabled ? "Aktif" : "Nonaktif"}
                      </p>
                      <p className="text-sm text-text-muted">
                        Saat aktif, bot merespons pertanyaan penjualan dari chat yang diotorisasi.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={botForm.enabled}
                      onClick={() =>
                        setBotForm((current) => ({
                          ...current,
                          enabled: !current.enabled,
                        }))
                      }
                      className={`relative inline-flex h-8 w-16 items-center rounded-full border-2 border-black transition-all ${
                        botForm.enabled
                          ? "bg-accent-success"
                          : "bg-accent-danger"
                      }`}
                    >
                      <span
                        className={`absolute top-1 flex h-5 w-5 rounded-full bg-white shadow-[2px_2px_0px_#1A1A1A] transition-all ${
                          botForm.enabled ? "left-9" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Summary Closing Harian</Label>
                  <div className="flex items-center justify-between rounded-2xl border-2 border-black bg-bg-main px-4 py-3">
                    <div>
                      <p className="font-bold">
                        {botForm.summaryEnabled ? "Aktif" : "Nonaktif"}
                      </p>
                      <p className="text-sm text-text-muted">
                        Executive summary dikirim satu kali tiap business day selesai.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={botForm.summaryEnabled}
                      onClick={() =>
                        setBotForm((current) => ({
                          ...current,
                          summaryEnabled: !current.summaryEnabled,
                        }))
                      }
                      className={`relative inline-flex h-8 w-16 items-center rounded-full border-2 border-black transition-all ${
                        botForm.summaryEnabled
                          ? "bg-accent-success"
                          : "bg-accent-danger"
                      }`}
                    >
                      <span
                        className={`absolute top-1 flex h-5 w-5 rounded-full bg-white shadow-[2px_2px_0px_#1A1A1A] transition-all ${
                          botForm.summaryEnabled ? "left-9" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input
                    value={botForm.timezone}
                    onChange={(event) =>
                      setBotForm((current) => ({
                        ...current,
                        timezone: event.target.value,
                      }))
                    }
                    placeholder="Asia/Jakarta"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jam Closing</Label>
                  <Input
                    value={botForm.closingTimeLocal}
                    onChange={(event) =>
                      setBotForm((current) => ({
                        ...current,
                        closingTimeLocal: event.target.value,
                      }))
                    }
                    placeholder="22:00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>OpenAI API Key</Label>
                    <Badge
                      variant={
                        botSecretStatus.hasOpenAiApiKey ? "success" : "outline"
                      }
                    >
                      {botSecretStatus.hasOpenAiApiKey ? "Tersimpan" : "Belum ada"}
                    </Badge>
                  </div>
                  <Input
                    type="password"
                    value={botSecrets.openaiApiKey}
                    onChange={(event) =>
                      setBotSecrets((current) => ({
                        ...current,
                        openaiApiKey: event.target.value,
                      }))
                    }
                    placeholder="Isi hanya jika ingin menambah/mengganti API key"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Telegram Bot Token</Label>
                    <Badge
                      variant={
                        botSecretStatus.hasTelegramBotToken
                          ? "success"
                          : "outline"
                      }
                    >
                      {botSecretStatus.hasTelegramBotToken
                        ? "Tersimpan"
                        : "Belum ada"}
                    </Badge>
                  </div>
                  <Input
                    type="password"
                    value={botSecrets.telegramBotToken}
                    onChange={(event) =>
                      setBotSecrets((current) => ({
                        ...current,
                        telegramBotToken: event.target.value,
                      }))
                    }
                    placeholder="Isi hanya jika ingin menambah/mengganti bot token"
                  />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-black bg-bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">Chat Telegram Terdeteksi</p>
                    <p className="text-sm text-text-muted">
                      Chat muncul di sini setelah mengirim `/start` ke bot.
                    </p>
                  </div>
                  <Badge variant="outline">{botChats.length} chat</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {botChats.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border-default p-4 text-sm text-text-muted">
                      Belum ada chat yang terdeteksi.
                    </div>
                  ) : (
                    botChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="rounded-xl border-2 border-black bg-bg-main p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold">
                                {chat.title || chat.username || chat.telegramChatId}
                              </p>
                              <Badge
                                variant={chat.isAuthorized ? "success" : "warning"}
                              >
                                {chat.isAuthorized ? "Diotorisasi" : "Kandidat"}
                              </Badge>
                              {chat.canReceiveSummary ? (
                                <Badge variant="secondary">Penerima Summary</Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-text-muted">
                              {chat.chatType} • ID {chat.telegramChatId}
                              {chat.username ? ` • @${chat.username}` : ""}
                            </p>
                            <p className="text-xs text-text-muted">
                              Terakhir terlihat:{" "}
                              {chat.lastSeenAt
                                ? new Date(chat.lastSeenAt).toLocaleString("id-ID")
                                : "-"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant={chat.isAuthorized ? "outline" : "success"}
                              size="sm"
                              onClick={() => handleToggleChatAuthorization(chat.id)}
                            >
                              {chat.isAuthorized ? "Cabut Akses" : "Otorisasi"}
                            </Button>
                            <Button
                              variant={chat.canReceiveSummary ? "secondary" : "outline"}
                              size="sm"
                              disabled={!chat.isAuthorized}
                              onClick={() => handleSelectSummaryChat(chat.id)}
                            >
                              {chat.canReceiveSummary
                                ? "Batalkan Summary"
                                : "Jadikan Chat Summary"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button onClick={handleSaveBot} disabled={savingBot}>
                {savingBot ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" /> Simpan Pengaturan Bot
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
                      { value: "ADMIN", label: "Pemilik Toko (Admin)" },
                      { value: "MANAGER", label: "Manager Cabang" },
                      { value: "CASHIER", label: "Kasir POS" },
                      { value: "KITCHEN", label: "Koki Dapur & Bar (KDS)" },
                      { value: "INVENTORY", label: "Staf Gudang & Stok" },
                      { value: "ACCOUNTANT", label: "Akuntan SAK EMKM" },
                    ]}
                  />
                </div>
                {(userForm.role === "ADMIN" ||
                  userForm.role === "MANAGER") && (
                  <div className="space-y-2">
                    <Label>
                      PIN Supervisor (6-8 digit)
                    </Label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      value={userForm.supervisorPin}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          supervisorPin: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder={
                        userDialog.mode === "edit"
                          ? "Kosongkan jika tidak ingin mengubah"
                          : "Wajib diisi untuk Admin/Manager"
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      PIN digunakan untuk otorisasi void transaksi & diskon
                      besar oleh Kasir.
                    </p>
                  </div>
                )}
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
