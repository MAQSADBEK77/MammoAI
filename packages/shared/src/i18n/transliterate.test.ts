import { describe, expect, it } from "vitest";
import { latinToCyrillicUz } from "./transliterate";

describe("latinToCyrillicUz — asosiy qoidalar", () => {
  it("digraflar va tutuq belgisi", () => {
    expect(latinToCyrillicUz("shifokor")).toBe("шифокор");
    expect(latinToCyrillicUz("chiziq")).toBe("чизиқ");
    expect(latinToCyrillicUz("o'g'il")).toBe("ўғил");
    expect(latinToCyrillicUz("san'at")).toBe("санъат");
  });

  it("so'z boshidagi 'e' — э, ichkarida — е", () => {
    expect(latinToCyrillicUz("eslatma")).toBe("эслатма");
    expect(latinToCyrillicUz("tekshiruv")).toBe("текшируv".replace("v", "в"));
  });

  it("raqam, tinish belgisi va emoji o'zgarmaydi", () => {
    expect(latinToCyrillicUz("28 kun — 🌸")).toBe("28 кун — 🌸");
  });
});

// Lotincha -ksiya qo'shimchali o'zlashmalar kirillda -кция bo'ladi.
describe("ksiya -> кция", () => {
  it("tibbiy va umumiy so'zlar to'g'ri yoziladi", () => {
    expect(latinToCyrillicUz("infeksiya")).toBe("инфекция");
    expect(latinToCyrillicUz("funksiya")).toBe("функция");
    expect(latinToCyrillicUz("funksiyalari")).toBe("функциялари");
  });

  it("qoida gap ichida va bosh harfda ham ishlaydi", () => {
    expect(latinToCyrillicUz("Funksiya ishlamadi")).toBe("Функция ишламади");
    expect(latinToCyrillicUz("siydik yo'llari infeksiyasi")).toBe("сийдик йўллари инфекцияси");
  });

  it("boshqa 'ks' va 'ya' birikmalariga TEGMAYDI", () => {
    expect(latinToCyrillicUz("maksimal")).toBe("максимал");
    expect(latinToCyrillicUz("yaxshi")).toBe("яхши");
  });
});

// Eng keng tarqalgan o'zbek so'zlaridan biri noto'g'ri o'girilardi.
describe("yo' — digraf emas, 'y' + 'o''", () => {
  it("yo'q -> йўқ ('ёъқ' emas)", () => {
    expect(latinToCyrillicUz("yo'q")).toBe("йўқ");
    expect(latinToCyrillicUz("yo'qligini")).toBe("йўқлигини");
    expect(latinToCyrillicUz("yo'nalish")).toBe("йўналиш");
  });

  it("tutuq belgisisiz 'yo' hali ham digraf", () => {
    expect(latinToCyrillicUz("yoz")).toBe("ёз");
    expect(latinToCyrillicUz("yordam")).toBe("ёрдам");
  });

  it("yog' va yo'g'on — farq tutuq belgisining O'RNIDA", () => {
    expect(latinToCyrillicUz("yog'")).toBe("ёғ");
    expect(latinToCyrillicUz("yo'g'on")).toBe("йўғон");
  });
});
