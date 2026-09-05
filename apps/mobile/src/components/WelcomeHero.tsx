// App.pdf §1 — "birinchi kirishdagi animatsiya logo bilan". Logo fonsiz, harakatsiz
// (bir marta join qilib chiqishdan tashqari) turadi, sarlavha/subtitle ketma-ket
// pastdan suzib chiqadi.
//
// DIQQAT: Animated.View/Animated.Text'da NativeWind className interop'i har doim
// kafolatlanmagani uchun statik uslublar ham oddiy `style` orqali beriladi (rang/
// o'lcham/shrift) — bu native build osti (RN core `style` prop'i) hech qanday
// qo'shimcha sozlamasiz ishlaydi.
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from "react-native-reanimated";
import { Logo } from "./Logo";

export function WelcomeHero({ title, subtitle }: { title: string; subtitle: string }) {
  const titleY = useSharedValue(16);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(16);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(200, withTiming(0, { duration: 500 }));
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    subtitleY.value = withDelay(400, withTiming(0, { duration: 500 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value, transform: [{ translateY: subtitleY.value }] }));

  return (
    <View style={{ alignItems: "center", gap: 24 }}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {/* Logo — fonsiz, animatsiyasiz, shunchaki gradient fon ustida turadi (web
            bilan bir xil ko'rinish — orqasida doira/glow yo'q, RN'da haqiqiy blur
            bo'lmagani uchun avvalgi "xira doira" qattiq chekka bilan ko'rinib qolardi). */}
        <Logo width={180} height={101} />
      </View>
      <Animated.Text style={[{ textAlign: "center", fontSize: 30, fontWeight: "800", color: "#FFFFFF" }, titleStyle]}>{title}</Animated.Text>
      <Animated.Text style={[{ maxWidth: 260, textAlign: "center", color: "rgba(255,255,255,0.85)" }, subtitleStyle]}>{subtitle}</Animated.Text>
    </View>
  );
}
