// App.pdf §1 — "birinchi kirishdagi animatsiya logo bilan". Logo-belgi sakrab
// kattalashadi, sarlavha/subtitle ketma-ket pastdan suzib chiqadi.
//
// DIQQAT: Animated.View/Animated.Text'da NativeWind className interop'i har doim
// kafolatlanmagani uchun statik uslublar ham oddiy `style` orqali beriladi (rang/
// o'lcham/shrift) — bu native build osti (RN core `style` prop'i) hech qanday
// qo'shimcha sozlamasiz ishlaydi.
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, withRepeat, withSequence, Easing } from "react-native-reanimated";

export function WelcomeHero({ title, subtitle }: { title: string; subtitle: string }) {
  const badgeScale = useSharedValue(0);
  const pulse = useSharedValue(1);
  const titleY = useSharedValue(16);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(16);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    badgeScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    pulse.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(200, withTiming(0, { duration: 500 }));
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    subtitleY.value = withDelay(400, withTiming(0, { duration: 500 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value * pulse.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value, transform: [{ translateY: subtitleY.value }] }));

  return (
    <View style={{ alignItems: "center", gap: 24 }}>
      <Animated.View
        style={[
          { height: 80, width: 80, alignItems: "center", justifyContent: "center", borderRadius: 40, backgroundColor: "rgba(255,255,255,0.15)" },
          badgeStyle,
        ]}
      >
        <Animated.Text style={{ fontSize: 30 }}>🎗️</Animated.Text>
      </Animated.View>
      <Animated.Text style={[{ textAlign: "center", fontSize: 30, fontWeight: "800", color: "#FFFFFF" }, titleStyle]}>{title}</Animated.Text>
      <Animated.Text style={[{ maxWidth: 260, textAlign: "center", color: "rgba(255,255,255,0.85)" }, subtitleStyle]}>{subtitle}</Animated.Text>
    </View>
  );
}
