"use client";

// LANDING-CALC (2026-09-16): lalu.uz'dagi kabi, ro'yxatdan o'tmasdan
// ishlaydigan 4 ta bepul kalkulyator — bosh sahifada. Sof matematika
// (packages/shared/src/logic/public-calculators.ts) ustiga qurilgan, hech
// qanday server so'rovi yubormaydi, hech narsa saqlamaydi. Ilova ichidagi
// haqiqiy tsikl/homiladorlik bashorat pipeline'iga (predictCycle) taʼsir
// qilmaydi va undan foydalanmaydi — mustaqil, "demo" hisoblagich.

import { useMemo, useState } from "react";
import clsx from "clsx";
import { CalculateOutlined, FavoriteBorderOutlined, EventOutlined, ScienceOutlined } from "@mui/icons-material";
import {
  calcDueDateEstimate,
  calcHcgEstimateFromLmp,
  calcOvulationEstimate,
  calcPregnancyMonth,
  formatDateDisplay,
  tashkentDateStr,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Card, DateWheelPicker, WheelPicker } from "@/components/ui";

const ACCENT_CHIP_CLASSES = ["bg-primary/10 text-primary", "bg-secondary/10 text-secondary", "bg-accent/10 text-accent", "bg-primary/10 text-primary"];
const CYCLE_LENGTH_OPTIONS = Array.from({ length: 40 - 21 + 1 }, (_, i) => 21 + i);
const WEEK_OPTIONS = Array.from({ length: 42 }, (_, i) => i + 1);

// Sana g'ildiragi uchun andoza sana — kalkulyator ochilganda darhol HAQIQIY
// (misol) natija ko'rsatishi uchun "bugungi kundan 14 kun oldin" bilan
// oldindan to'ldirilgan (artifact-design'dagi "bo'sh idish emas, ishlayotgan
// holat" tamoyili — bu yerda oddiy UX amaliyoti sifatida qo'llanildi).
function defaultPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function CalcCard({
  icon: Icon,
  accentClass,
  title,
  desc,
  children,
}: {
  icon: typeof CalculateOutlined;
  accentClass: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6! text-left">
      <div className={clsx("mb-3 flex h-11 w-11 items-center justify-center rounded-2xl", accentClass)}>
        <Icon fontSize="small" />
      </div>
      <h3 className="text-base font-bold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm text-text-secondary">{desc}</p>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function ResultLine({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 rounded-2xl bg-background px-4 py-3 text-sm font-bold text-text-primary">{children}</p>;
}

export function PublicCalculators() {
  const { dict } = useI18n();
  const l = dict.landing.calculators;
  const today = tashkentDateStr();
  const months = dict.common.months;
  const thisYear = new Date().getFullYear();

  const [dueLmp, setDueLmp] = useState(() => defaultPastDate(70));
  const [ovulLmp, setOvulLmp] = useState(() => defaultPastDate(14));
  const [cycleLength, setCycleLength] = useState(28);
  const [week, setWeek] = useState(20);
  const [hcgLmp, setHcgLmp] = useState(() => defaultPastDate(35));

  const dueResult = useMemo(() => calcDueDateEstimate(dueLmp, today), [dueLmp, today]);
  const ovulResult = useMemo(() => calcOvulationEstimate(ovulLmp, cycleLength), [ovulLmp, cycleLength]);
  const monthResult = useMemo(() => calcPregnancyMonth(week), [week]);
  const hcgResult = useMemo(() => calcHcgEstimateFromLmp(hcgLmp, today), [hcgLmp, today]);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <CalcCard icon={EventOutlined} accentClass={ACCENT_CHIP_CLASSES[0]} title={l.dueDate.title} desc={l.dueDate.desc}>
        <DateWheelPicker value={dueLmp} onChange={setDueLmp} monthLabels={months} minYear={thisYear - 3} maxYear={thisYear} />
        {dueResult && <ResultLine>{l.dueDate.result(formatDateDisplay(dueResult.dueDate), dueResult.currentWeek)}</ResultLine>}
      </CalcCard>

      <CalcCard icon={FavoriteBorderOutlined} accentClass={ACCENT_CHIP_CLASSES[1]} title={l.ovulation.title} desc={l.ovulation.desc}>
        <DateWheelPicker value={ovulLmp} onChange={setOvulLmp} monthLabels={months} minYear={thisYear - 3} maxYear={thisYear} />
        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-text-secondary">{dict.landing.calculatorsCycleLengthLabel}</p>
          <WheelPicker compact options={CYCLE_LENGTH_OPTIONS} value={cycleLength} suffix="kun" onChange={setCycleLength} />
        </div>
        {ovulResult && (
          <>
            <ResultLine>{l.ovulation.resultOvulation(formatDateDisplay(ovulResult.ovulationDate))}</ResultLine>
            <p className="mt-2 text-xs text-text-secondary">
              {l.ovulation.resultFertile(formatDateDisplay(ovulResult.fertileWindowStart), formatDateDisplay(ovulResult.fertileWindowEnd))}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{l.ovulation.resultNextPeriod(formatDateDisplay(ovulResult.nextPeriodDate))}</p>
          </>
        )}
      </CalcCard>

      <CalcCard icon={CalculateOutlined} accentClass={ACCENT_CHIP_CLASSES[2]} title={l.weekToMonth.title} desc={l.weekToMonth.desc}>
        <p className="mb-1 text-xs font-semibold text-text-secondary">{dict.landing.calculatorsWeekLabel}</p>
        <WheelPicker compact options={WEEK_OPTIONS} value={week} suffix="hafta" onChange={setWeek} />
        <ResultLine>{l.weekToMonth.result(monthResult)}</ResultLine>
      </CalcCard>

      <CalcCard icon={ScienceOutlined} accentClass={ACCENT_CHIP_CLASSES[3]} title={l.hcg.title} desc={l.hcg.desc}>
        <DateWheelPicker value={hcgLmp} onChange={setHcgLmp} monthLabels={months} minYear={thisYear - 3} maxYear={thisYear} />
        <ResultLine>
          {hcgResult ? l.hcg.result(hcgResult.weekLabel, hcgResult.min.toLocaleString("ru-RU"), hcgResult.max.toLocaleString("ru-RU")) : l.hcg.outOfRange}
        </ResultLine>
      </CalcCard>
    </div>
  );
}
