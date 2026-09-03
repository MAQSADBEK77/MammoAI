import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface DrawerContextValue {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

/** Chap tomondagi burger-menyu holati — global, chunki tugma har bir tab
 * ekranida (asosiy/jamiyat/tekshiruvlar/profil), menyuning o'zi esa bitta
 * marta ildiz layout'da render qilinadi (@/components/AppDrawer). */
export function DrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, openDrawer: () => setOpen(true), closeDrawer: () => setOpen(false) }), [open]);
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer — DrawerProvider ichida chaqirilishi kerak");
  return ctx;
}
