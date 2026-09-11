"use client";

// Haftalik o'lcham uchun AYLANTIRISH MUMKIN 3D model (foydalanuvchi so'rovi:
// "3D rasmlarni qo'yish", "aylantirsa bo'ladigan"). SizeIllustration'dagi
// placeholder emoji-doira o'rniga — ammo tarmoq/model yuklanmasa SHU
// placeholder'ga chiroyli tushadi (pastda, graceful fallback).
//
// `<model-viewer>` — Google'ning veb-komponenti (@google/model-viewer),
// GLB'ni yuklash + orbit/pinch-zoom boshqaruvini o'zi ichida hal qiladi,
// alohida Three.js/R3F sozlash shart emas. Model fayllari
// `apps/web/public/models/fruit/*.glb`'da — packages/shared#PREGNANCY_3D_MODEL_BY_ICON
// tekshirilgach (haqiqiy tibbiy-realistik fetus modellari deyarli hammasi
// pullik ekan), foydalanuvchi bilan kelishilgan "meva bilan o'lcham
// taqqoslash" uslubi — poly.pizza'dan CC-BY 3.0 ("Poly by Google").

import { useState } from "react";
import "@google/model-viewer";
import { get3dModelKeyForIcon } from "@mammoai/shared";
import { SizeIllustration } from "@/components/SizeIllustration";

export function Pregnancy3DViewer({ icon }: { icon: string }) {
  const [failed, setFailed] = useState(false);
  const key = get3dModelKeyForIcon(icon);

  if (failed) return <SizeIllustration icon={icon} />;

  return (
    <div className="mx-auto h-40 w-40">
      {/* @ts-expect-error — model-viewer JSX turi @google/model-viewer'dan avtomatik kelmaydi */}
      <model-viewer
        src={`/models/fruit/${key}.glb`}
        camera-controls="true"
        auto-rotate="true"
        auto-rotate-delay="0"
        rotation-per-second="18deg"
        disable-zoom="true"
        interaction-prompt="none"
        shadow-intensity="1"
        exposure="1.1"
        style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
