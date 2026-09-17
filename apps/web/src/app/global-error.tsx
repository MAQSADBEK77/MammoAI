"use client";

// WEB3-16: ROOT layout'ning O'ZI qulasa (masalan providerlardan birida xato)
// Next.js shu faylni ishlatadi — bu holda I18nProvider ham ishlamagan bo'lishi
// mumkin, shuning uchun bu sahifa I18nProvider/Tailwind token'lariga
// TAYANMAYDI (qattiq yozilgan matn, inline uslublar) va o'zining
// <html>/<body>'sini chizadi (Next.js talabi — bu fayl butun root layout'ni
// ALMASHTIRADI, ichiga o'ralmaydi).
const TITLE = "Nimadir xato ketdi";
const BODY = "Ilovani yuklashda kutilmagan xato yuz berdi. Qayta urinib ko'ring.";
const RETRY = "Qayta urinish";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="uz">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#1f2937" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100dvh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>{TITLE}</h1>
          <p style={{ fontSize: "14px", color: "#4b5563", maxWidth: "360px", margin: 0 }}>{BODY}</p>
          <button
            type="button"
            onClick={reset}
            style={{
              borderRadius: "999px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
              background: "#F43F7F",
              border: "none",
              cursor: "pointer",
            }}
          >
            {RETRY}
          </button>
        </div>
      </body>
    </html>
  );
}
