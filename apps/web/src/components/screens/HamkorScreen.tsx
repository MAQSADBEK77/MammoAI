"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, Switch, Avatar } from "@mui/material";
import {
  BarChartOutlined,
  NotificationsActiveOutlined,
  ChatBubbleOutlineOutlined,
  ContentCopyOutlined,
  Circle,
} from "@mui/icons-material";
import type { PartnerShareSettings, PartnerStatusResponse } from "@mammoai/shared";
import { MOOD_EMOJI, formatDateDisplay } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button, Card, LoadingSpinner, ScreenHeader, Badge } from "@/components/ui";
import { PartnerChatDialog } from "./PartnerChatDialog";

/**
 * "Hamkor" bo'limi — Figma referens (https://www.figma.com/make/M7nwCcQDmwjZsaadesxS88)
 * "Partner Tab": kod orqali ulanish, ulashish sozlamalari, hamkor ma'lumotlari.
 * To'liq backend bilan ishlaydi — apps/web/src/server/repo.ts#getPartnerStatus va h.k.
 */
export function HamkorScreen() {
  const { dict } = useI18n();
  const [status, setStatus] = useState<PartnerStatusResponse | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.partner.status().then(setStatus);
  }, []);

  if (!status) return <LoadingSpinner label={dict.common.loading} />;

  function flashMessage(text: string) {
    setFlash(text);
    setTimeout(() => setFlash(null), 2000);
  }

  async function openConnectModal() {
    setConnectError(null);
    setConnectOpen(true);
    if (!status!.myInviteCode) {
      const res = await api.partner.generateCode();
      setStatus(res);
    }
  }

  async function submitCode() {
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await api.partner.connect(codeInput);
      setStatus(res);
      setConnectOpen(false);
      setCodeInput("");
    } catch {
      setConnectError(dict.partner.invalidCode);
    } finally {
      setConnecting(false);
    }
  }

  async function toggleShare(key: keyof PartnerShareSettings) {
    if (!status!.mySharing || saving) return;
    setSaving(true);
    try {
      const next = { ...status!.mySharing, [key]: !status!.mySharing[key] };
      setStatus(await api.partner.updateSettings(next));
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    if (!window.confirm(dict.partner.disconnectConfirm)) return;
    setStatus(await api.partner.disconnect());
  }

  async function copyCode() {
    if (!status!.myInviteCode) return;
    await navigator.clipboard.writeText(status!.myInviteCode);
    flashMessage(dict.partner.codeCopied);
  }

  const daysAgo = status.linkedSince ? Math.floor((new Date().getTime() - new Date(status.linkedSince).getTime()) / 86400000) : 0;
  const initials = (status.partner?.name?.trim()?.[0] ?? "🙂").toUpperCase();

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={dict.partner.title} subtitle={dict.partner.subtitle} />

      {!status.linked ? (
        <>
          <div className="bg-aurora-hero space-y-2 rounded-[28px] p-6 text-center">
            <p className="text-4xl">🐰❤️🐰</p>
            <p className="text-lg font-bold text-text-primary">{dict.partner.heroTitle}</p>
            <p className="text-sm text-text-secondary">{dict.partner.heroDescription}</p>
          </div>

          <Card className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <BarChartOutlined sx={{ fontSize: 20 }} className="text-primary" />
            </span>
            <div>
              <p className="font-semibold text-text-primary">{dict.partner.featureSharingTitle}</p>
              <p className="text-sm text-text-secondary">{dict.partner.featureSharingDescription}</p>
            </div>
          </Card>
          <Card className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warning/10">
              <NotificationsActiveOutlined sx={{ fontSize: 20 }} className="text-warning" />
            </span>
            <div>
              <p className="font-semibold text-text-primary">{dict.partner.featureRemindersTitle}</p>
              <p className="text-sm text-text-secondary">{dict.partner.featureRemindersDescription}</p>
            </div>
          </Card>
          <Card className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10">
              <ChatBubbleOutlineOutlined sx={{ fontSize: 20 }} className="text-secondary" />
            </span>
            <div>
              <p className="font-semibold text-text-primary">{dict.partner.featureMessagesTitle}</p>
              <p className="text-sm text-text-secondary">{dict.partner.featureMessagesDescription}</p>
            </div>
          </Card>

          <Button className="w-full" onClick={openConnectModal}>
            {dict.partner.connectButton}
          </Button>
          <Button variant="ghost" className="w-full border border-border" onClick={openConnectModal}>
            {dict.partner.enterCodeButton}
          </Button>
        </>
      ) : (
        <>
          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar src={status.partner?.avatarUrl ?? undefined} sx={{ width: 48, height: 48, bgcolor: "var(--color-primary-light)" }}>
                {!status.partner?.avatarUrl && initials}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-bold text-text-primary">{status.partner?.name || dict.profile.noNameFallback}</p>
                  <Circle sx={{ fontSize: 8 }} className="text-success" />
                </div>
                <p className="text-xs text-text-secondary">{dict.partner.roleLabel}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setChatOpen(true)}>
                <ChatBubbleOutlineOutlined sx={{ fontSize: 16 }} /> {dict.partner.messageButton}
              </Button>
              <Button className="flex-1" onClick={() => setStatsOpen(true)}>
                <BarChartOutlined sx={{ fontSize: 16 }} /> {dict.partner.statsButton}
              </Button>
            </div>
          </Card>

          <div className="space-y-2">
            <p className="text-sm font-bold text-text-primary">{dict.partner.canSeeTitle}</p>
            <Card className="space-y-1">
              <SharingRow
                icon="🤰"
                label={dict.partner.shareTogglePregnancy}
                checked={!!status.mySharing?.pregnancy}
                onChange={() => toggleShare("pregnancy")}
              />
              <SharingRow
                icon="🗓️"
                label={dict.partner.shareToggleCheckups}
                checked={!!status.mySharing?.checkups}
                onChange={() => toggleShare("checkups")}
              />
              <SharingRow
                icon="😊"
                label={dict.partner.shareToggleMood}
                checked={!!status.mySharing?.mood}
                onChange={() => toggleShare("mood")}
              />
              <SharingRow
                icon="🩸"
                label={dict.partner.shareTogglePeriod}
                checked={!!status.mySharing?.period}
                onChange={() => toggleShare("period")}
                last
              />
            </Card>
          </div>

          {status.linkedSince && (
            <Card className="bg-primary-light/30">
              <p className="text-sm font-semibold text-primary-dark">
                {daysAgo <= 0 ? dict.partner.connectedToday : dict.partner.connectedDaysAgo(daysAgo)}
              </p>
            </Card>
          )}

          <button type="button" onClick={disconnect} className="w-full text-center text-sm font-semibold text-danger">
            {dict.partner.disconnectButton}
          </button>
        </>
      )}

      {flash && <p className="text-center text-sm text-text-muted">{flash}</p>}

      {/* Ulanish modali — kod ko'rsatish + kod kiritish, Figma'dagi bitta oyna */}
      <Dialog open={connectOpen} onClose={() => setConnectOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{dict.partner.modalTitle}</DialogTitle>
        <DialogContent className="space-y-4 pb-2!">
          <div className="rounded-2xl bg-surface-muted p-4 text-center">
            <p className="text-xs text-text-muted">{dict.partner.yourCodeLabel}</p>
            <button onClick={copyCode} className="mt-1 inline-flex items-center gap-1.5 text-xl font-extrabold text-primary">
              {status.myInviteCode ?? "…"} <ContentCopyOutlined sx={{ fontSize: 16 }} />
            </button>
            <p className="mt-1 text-xs text-text-muted">{dict.partner.sendCodeHint}</p>
          </div>
          <p className="text-center text-xs font-semibold text-text-muted">{dict.partner.orDivider}</p>
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder={dict.partner.codeInputPlaceholder}
            className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary"
          />
          {connectError && <p className="text-sm text-danger">{connectError}</p>}
          <Button className="w-full" disabled={!codeInput.trim() || connecting} onClick={submitCode}>
            {connecting ? dict.partner.connecting : dict.partner.connectSubmitButton}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Hamkor bilan to'liq suhbat — Telegram uslubidagi chat. */}
      <PartnerChatDialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        partnerName={status.partner?.name || dict.profile.noNameFallback}
        partnerAvatarUrl={status.partner?.avatarUrl ?? null}
      />

      {/* Ko'rsatkichlar modali — hamkor ulashgan (ruxsat bergan) ma'lumotlar */}
      <Dialog open={statsOpen} onClose={() => setStatsOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>{dict.partner.statsModalTitle}</DialogTitle>
        <DialogContent className="space-y-2 pb-4!">
          {!status.partnerData ||
          (status.partnerData.pregnancyWeek === null &&
            !status.partnerData.nextCheckup &&
            !status.partnerData.todayMood &&
            status.partnerData.cycleDay === null) ? (
            <p className="text-sm text-text-muted">{dict.partner.noDataShared}</p>
          ) : (
            <>
              {status.partnerData.pregnancyWeek !== null && (
                <Badge tone="primary">{dict.partner.statPregnancyWeek(status.partnerData.pregnancyWeek)}</Badge>
              )}
              {status.partnerData.nextCheckup && (
                <p className="text-sm text-text-primary">
                  <span className="font-semibold">{dict.partner.statNextCheckupLabel}:</span>{" "}
                  {dict.checklist.items[status.partnerData.nextCheckup.type].title} — {formatDateDisplay(status.partnerData.nextCheckup.date)}
                </p>
              )}
              {status.partnerData.todayMood && (
                <p className="text-sm text-text-primary">
                  <span className="font-semibold">{dict.partner.statMoodLabel}:</span> {MOOD_EMOJI[status.partnerData.todayMood]}{" "}
                  {dict.cycle.moods[status.partnerData.todayMood]}
                </p>
              )}
              {status.partnerData.cycleDay !== null && (
                <p className="text-sm text-text-primary">{dict.partner.statCycleDay(status.partnerData.cycleDay)}</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SharingRow({
  icon,
  label,
  checked,
  onChange,
  last,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${last ? "" : "border-b border-border"}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-text-primary">{label}</span>
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": { color: "#fff" },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--color-primary)", opacity: 1 },
        }}
      />
    </div>
  );
}
