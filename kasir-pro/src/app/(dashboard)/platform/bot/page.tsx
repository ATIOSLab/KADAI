"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, Loader2, Save, Clock, KeyRound, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";

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

/**
 * Pengaturan Bot Platform (SUPER_ADMIN).
 * Satu baris konfigurasi bot global + kredensial platform: berlaku untuk semua tenant KADAI.
 */
export default function PlatformBotSettingsPage() {
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

  useEffect(() => {
    queueMicrotask(() => {
      void fetchBot();
    });
  }, [fetchBot]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <PageHeader
        title="Pengaturan Bot Platform"
        description="Konfigurasi bot Telegram, jadwal closing, dan kredensial AI ini berlaku untuk seluruh platform KADAI (semua tenant)."
        eyebrow="Platform"
        icon={Bot}
      />

      {/* ═══ Status & Jadwal Bot ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" /> Telegram Sales Bot
          </CardTitle>
          <CardDescription>
            Satu bot global yang melayani pertanyaan penjualan dan executive summary
            untuk seluruh tenant.
          </CardDescription>
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
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
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
                      className={`relative inline-flex h-8 w-16 items-center rounded-full border border-slate-300 transition-all ${
                        botForm.enabled
                          ? "bg-accent-success"
                          : "bg-accent-danger"
                      }`}
                    >
                      <span
                        className={`absolute top-1 flex h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                          botForm.enabled ? "left-9" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Summary Closing Harian</Label>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
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
                      className={`relative inline-flex h-8 w-16 items-center rounded-full border border-slate-300 transition-all ${
                        botForm.summaryEnabled
                          ? "bg-accent-success"
                          : "bg-accent-danger"
                      }`}
                    >
                      <span
                        className={`absolute top-1 flex h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
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
                <div className="space-y-2">
                  <Label>Mode Hari Bisnis</Label>
                  <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-border bg-bg-main px-3">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Clock className="size-4 text-text-muted" /> Closing Cutoff
                    </span>
                    <Badge variant="outline">{botForm.businessDayMode}</Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ Kredensial & Chat Telegram ═══ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" /> Kredensial & Chat Telegram
          </CardTitle>
          <CardDescription>
            Kunci API dan token bot disimpan terenkripsi. Isi hanya bila ingin
            menambah atau mengganti nilai yang sudah tersimpan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadingBot ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
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

              <div className="rounded-2xl border border-slate-200 bg-bg-card p-4 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 font-black">
                      <MessageSquare className="size-4" /> Chat Telegram Terdeteksi
                    </p>
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
                        className="rounded-xl border border-slate-200 bg-bg-main p-4 shadow-2xs"
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
    </div>
  );
}