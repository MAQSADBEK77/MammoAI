#!/usr/bin/env python3
"""Onboarding bosqich-belgilari uchun "nafas olayotgan aura" Lottie animatsiyasini
qayta yasaydi — public/animations/aura-{primary,secondary,accent}.json.

Uchinchi tomon fayl EMAS (litsenziya muammosi yo'q) — bu skript JSON'ni to'g'ridan-
to'g'ri Bodymovin/Lottie formatida qo'lda quradi: markazda statik rangli disk,
ustidan ikkita bosqichma-bosqich kengayib-xiralashadigan halqa (ripple/radar effekti).
Rang o'zgarsa yoki uslub sozlansa, shu faylni qayta ishga tushiring:

    python3 apps/web/scripts/generate-onboarding-animations.py

lottie-react (web) va keyinchalik lottie-react-native (mobil) shu JSON'larni
o'qiydi — packages/shared/src/design-tokens.ts'dagi primary/secondary/accent
ranglariga mos uchta variant.
"""
import json
import os

W = H = 240
CX = CY = 120
FPS = 30
CYCLE_S = 2.4
OP = round(CYCLE_S * FPS)  # 72 frame — bitta halqaning davri
STAGGER = OP // 2
TOTAL = OP + STAGGER  # composition uzunligi — ikkinchi halqa TO'LIQ tugaguncha


def hex_to_unit(hexcolor):
    hexcolor = hexcolor.lstrip("#")
    r, g, b = (int(hexcolor[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return [round(r, 4), round(g, 4), round(b, 4), 1]


def ease_kf(t, s):
    """Standart ease-in-out keyframe (oxirgi keyframe bundan mustasno)."""
    return {"i": {"x": 0.42, "y": 1}, "o": {"x": 0.58, "y": 0}, "t": t, "s": s}


def ring_layer(ind, color, start_frame, base_r, grow_to_r, op_start, nm):
    """Markazdan kengayib, xiralashib yo'qoladigan halqa (ripple) qatlami."""
    scale_end = round(grow_to_r / base_r * 100)
    return {
        "ddd": 0,
        "ind": ind,
        "ty": 4,
        "nm": nm,
        "sr": 1,
        "ks": {
            "o": {"a": 1, "k": [ease_kf(0, [op_start]), {"t": OP, "s": [0]}]},
            "r": {"a": 0, "k": 0},
            "p": {"a": 0, "k": [CX, CY, 0]},
            "a": {"a": 0, "k": [0, 0, 0]},
            "s": {"a": 1, "k": [ease_kf(0, [100, 100, 100]), {"t": OP, "s": [scale_end, scale_end, 100]}]},
        },
        "ao": 0,
        "shapes": [
            {
                "ty": "gr",
                "it": [
                    {"ty": "el", "p": {"a": 0, "k": [0, 0]}, "s": {"a": 0, "k": [base_r * 2, base_r * 2]}, "nm": "e"},
                    {"ty": "fl", "c": {"a": 0, "k": hex_to_unit(color)}, "o": {"a": 0, "k": 100}, "nm": "f"},
                    {
                        "ty": "tr",
                        "p": {"a": 0, "k": [0, 0]},
                        "a": {"a": 0, "k": [0, 0]},
                        "s": {"a": 0, "k": [100, 100]},
                        "r": {"a": 0, "k": 0},
                        "o": {"a": 0, "k": 100},
                    },
                ],
            }
        ],
        # MUHIM: har bir halqa faqat OWN start_frame..start_frame+OP oralig'ida "tirik" —
        # composition uzunligi (TOTAL) shu ikkinchi halqa tugaydigan joygacha bo'lishi
        # kerak, aks holda `loop:true` composition'ni halqa hali o'rtasida ekanida qayta
        # boshlab, keskin "sakrash" hosil qiladi.
        "ip": start_frame,
        "op": OP + start_frame,
        "st": start_frame,
        "bm": 0,
    }


def base_disc_layer(ind, color, r, nm):
    """Statik, doim to'liq ko'rinadigan markaziy rangli disk (ustiga ikonka qo'yiladi)."""
    return {
        "ddd": 0,
        "ind": ind,
        "ty": 4,
        "nm": nm,
        "sr": 1,
        "ks": {
            "o": {"a": 0, "k": 100},
            "r": {"a": 0, "k": 0},
            "p": {"a": 0, "k": [CX, CY, 0]},
            "a": {"a": 0, "k": [0, 0, 0]},
            "s": {"a": 0, "k": [100, 100, 100]},
        },
        "ao": 0,
        "shapes": [
            {
                "ty": "gr",
                "it": [
                    {"ty": "el", "p": {"a": 0, "k": [0, 0]}, "s": {"a": 0, "k": [r * 2, r * 2]}, "nm": "e"},
                    {"ty": "fl", "c": {"a": 0, "k": hex_to_unit(color)}, "o": {"a": 0, "k": 100}, "nm": "f"},
                    {
                        "ty": "tr",
                        "p": {"a": 0, "k": [0, 0]},
                        "a": {"a": 0, "k": [0, 0]},
                        "s": {"a": 0, "k": [100, 100]},
                        "r": {"a": 0, "k": 0},
                        "o": {"a": 0, "k": 100},
                    },
                ],
            }
        ],
        "ip": 0,
        "op": TOTAL,
        "st": 0,
        "bm": 0,
    }


def build(color_dark, color_light):
    layers = [
        ring_layer(1, color_light, 0, 62, 118, 32, "ring-a"),
        ring_layer(2, color_light, STAGGER, 62, 118, 32, "ring-b"),
        base_disc_layer(3, color_dark, 62, "disc"),
    ]
    return {
        "v": "5.9.6",
        "fr": FPS,
        "ip": 0,
        "op": TOTAL,
        "w": W,
        "h": H,
        "nm": "aura",
        "ddd": 0,
        "assets": [],
        "layers": layers,
        "markers": [],
    }


VARIANTS = {
    # nm: (to'q disk rangi, och halqa rangi) — packages/shared/src/design-tokens.ts bilan bir xil.
    "secondary": ("#7C3AED", "#A78BFA"),  # shaxsiy ma'lumot bosqichlari
    "primary": ("#F43F7F", "#FF7CA8"),  # tsikl bosqichlari
    "accent": ("#0D9488", "#2DD4BF"),  # sog'liq bosqichlari
}

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "animations")
    os.makedirs(out_dir, exist_ok=True)
    for name, (dark, light) in VARIANTS.items():
        path = os.path.join(out_dir, f"aura-{name}.json")
        with open(path, "w") as f:
            json.dump(build(dark, light), f)
        print("wrote", path)
