"use client";

import { useEffect, useState } from "react";

/**
 * TODAY-02 — yordamchining "mo'ralash" holati: ilova ochilganda yordamchi
 * TO'LIQ ekranni egallamaydi, pastda kichik karta (TodayAssistantCard)
 * ko'rinishida turadi va shu paytda pastki menyudagi yordamchi bandi
 * panel ustiga KO'TARILADI (BottomNav). Yopilgach, menyu yana tekis holatga
 * qaytadi — referens skrinshotlarda ham aynan shunday.
 *
 * Holat ikki xil komponentga kerak (karta va menyu), lekin ular bir-birining
 * ichida emas — shuning uchun umumiy provider o'rniga eng yengil yechim:
 * localStorage (qurilmada eslab qolish uchun baribir kerak) + oddiy `window`
 * hodisasi (bir sahifa ichida ikkalasini sinxron ushlab turish uchun).
 */

const DISMISS_KEY = "mammoai:today-assistant-dismissed-on";
const CHANGE_EVENT = "mammoai:assistant-peek-changed";

/** Mahalliy (qurilma vaqti bo'yicha) sana — UTC EMAS: foydalanuvchi uchun
 * "bugun" qachon tugashi uning soat mintaqasiga bog'liq. */
function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function readDismissed(): boolean {
  try {
    // Yopilgan SANA saqlanadi — ertaga yordamchi yana bir marta chiqadi
    // (foydalanuvchi so'rovi: "kuniga birinchi marta kirganda chiqsin").
    return window.localStorage.getItem(DISMISS_KEY) === localToday();
  } catch {
    // Maxfiylik rejimi / bloklangan saqlash — karta shunchaki ko'rinaveradi.
    return false;
  }
}

/** Yordamchi kartasini SHU KUNGA yopadi va buni tinglayotganlarga bildiradi. */
export function dismissAssistantPeek() {
  try {
    window.localStorage.setItem(DISMISS_KEY, localToday());
  } catch {
    // Saqlab bo'lmasa ham shu sessiya uchun yopilgani yetarli.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** `true` — yordamchi hozir "mo'ralab" turibdi (karta ko'rinadi). */
export function useAssistantPeek(): boolean {
  // Birinchi renderda DOIM `false` — server va mijoz HTML'i mos kelishi uchun
  // (localStorage faqat brauzerda mavjud). `setTimeout(..., 0)` esa
  // lib/i18n.tsx'dagi bilan bir xil naqsh: holatni effekt tanasida
  // to'g'ridan-to'g'ri o'rnatish kaskad renderlarga olib keladi.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(!readDismissed());
    const timeout = setTimeout(sync, 0);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  return visible;
}
