// Web'dagi Pregnancy3DViewer.tsx bilan bir xil naqsh — izoh o'sha yerda.
// React Native'da haqiqiy WebGL/Three.js native modul (expo-gl) qo'shish
// qo'shimcha native bog'lash va EAS rebuild talab qiladi; buning o'rniga
// allaqachon loyihada bor `react-native-webview` ichida bitta yengil HTML
// sahifa (`<model-viewer>` CDN'dan) ochiladi — xuddi web'dagi bilan bir xil
// GLB fayllarni (`https://mammo.uz/models/fruit/*.glb`, statik fayllar faqat
// web ilovada, alohida CDN yo'q) ko'rsatadi, native kod o'zgarishi shart emas.
import { useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { get3dModelKeyForIcon } from "@mammoai/shared";
import { SizeIllustration } from "@/components/SizeIllustration";

function buildHtml(modelUrl: string): string {
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}model-viewer{width:100%;height:100%;--poster-color:transparent;}</style>
</head><body>
<script type="module" src="https://mammo.uz/models/model-viewer.min.js"></script>
<model-viewer src="${modelUrl}" camera-controls auto-rotate auto-rotate-delay="0" rotation-per-second="18deg" disable-zoom shadow-intensity="1" exposure="1.1"></model-viewer>
</body></html>`;
}

export function Pregnancy3DViewer({ icon }: { icon: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <SizeIllustration icon={icon} />;

  const modelUrl = `https://mammo.uz/models/fruit/${get3dModelKeyForIcon(icon)}.glb`;

  return (
    <View style={{ width: 160, height: 160, alignSelf: "center", backgroundColor: "transparent" }}>
      <WebView
        source={{ html: buildHtml(modelUrl) }}
        style={{ backgroundColor: "transparent" }}
        // Ilova ichida hech qaysi sahifa ochib yubormasin — faqat 3D modelni ko'rsatadi.
        originWhitelist={["*"]}
        scrollEnabled={false}
        androidLayerType="hardware"
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
      />
    </View>
  );
}
