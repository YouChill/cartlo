# Design System — Cartlo

> Cartlo — rodzinna aplikacja do wspoldzielenia listy zakupow
> Stack: Next.js 14+ (App Router) | TypeScript | Tailwind CSS | shadcn/ui | Supabase

---

## 1. Filozofia

**Soft/Rounded Minimalizm** — ciepły, przytulny, przyjazny rodzinie.
Duze touch targets, czytelna typografia, mietowe akcenty na ciepłym tle.
Interfejs ma wyglądać jak dobrze zaprojektowany notatnik, nie jak korporacyjny dashboard.

**Zasady:**

- Mobile-first (telefon to primary device podczas zakupow)
- Minimalny czas do akcji (dodanie produktu = 1 tap + wpisanie + Enter)
- Czytelnosc w jasnym swietle (wysoki kontrast tekstu)
- Duze obszary dotykowe (min 44px touch target)

---

## 2. Paleta kolorow

### 2.1 Kolory bazowe

| Token              | Hex       | HSL            | Uzycie                           |
| ------------------ | --------- | -------------- | -------------------------------- |
| `--background`     | `#FAFAF8` | `60 20% 97.6%` | Tlo glowne (ciepla biel)         |
| `--surface`        | `#FFFFFF` | `0 0% 100%`    | Karty, inputy, elementy nad tlem |
| `--surface-raised` | `#F5F5F3` | `60 10% 95.7%` | Elementy hover, tla sekcji       |
| `--border`         | `#E8E8E4` | `60 7% 90.2%`  | Obramowania, separatory          |
| `--border-light`   | `#F0F0EC` | `60 10% 93.7%` | Subtelne separatory              |

### 2.2 Tekst

| Token              | Hex       | Uzycie                            |
| ------------------ | --------- | --------------------------------- |
| `--text-primary`   | `#1A1A1A` | Naglowki, glowny tekst            |
| `--text-secondary` | `#6B6B6B` | Tekst pomocniczy, podpisy         |
| `--text-tertiary`  | `#9B9B9B` | Placeholdery, meta-info           |
| `--text-disabled`  | `#C4C4C4` | Elementy wyłączone, checked items |

### 2.3 Mietowy akcent (Primary)

| Token        | Hex       | Uzycie                            |
| ------------ | --------- | --------------------------------- |
| `--mint-50`  | `#F0FDF6` | Najjasniejsze tlo akcentowe       |
| `--mint-100` | `#DCFCE8` | Tlo chipsa kategorii, badge       |
| `--mint-200` | `#BBF7D0` | Hover na elementach akcentowych   |
| `--mint-300` | `#86EFAC` | Checkbox fill (animowany)         |
| `--mint-400` | `#4ADE80` | Primary button, aktywne chipsy    |
| `--mint-500` | `#22C55E` | Primary dark, tekst na jasnym tle |
| `--mint-600` | `#16A34A` | Hover na primary button           |

### 2.4 Kolory statusowe

| Token       | Hex bg    | Hex text  | Uzycie                    |
| ----------- | --------- | --------- | ------------------------- |
| `--warning` | `#FEF3C7` | `#D97706` | "Do sklasyfikowania"      |
| `--error`   | `#FEE2E2` | `#DC2626` | Bledy walidacji, usuwanie |
| `--info`    | `#E0F2FE` | `#0284C7` | Informacje systemowe      |

---

## 3. Typografia

**Font:** [Nunito](https://fonts.google.com/specimen/Nunito) (Google Fonts)
**Import:** `next/font/google` — subset latin-ext (polskie znaki)
**Weights:** 400 (Regular), 600 (SemiBold), 700 (Bold)

| Element                 | Rozmiar          | Weight       | Line-height | Uzycie                    |
| ----------------------- | ---------------- | ------------ | ----------- | ------------------------- |
| Naglowek strony (h1)    | 24px / 1.5rem    | 700 Bold     | 1.3         | Tytul strony              |
| Naglowek sekcji (h2)    | 18px / 1.125rem  | 700 Bold     | 1.4         | "Kupione", "Czlonkowie"   |
| Naglowek kategorii (h3) | 15px / 0.9375rem | 600 SemiBold | 1.4         | Nazwa kategorii na liscie |
| Body / Lista item       | 16px / 1rem      | 400 Regular  | 1.5         | Nazwa produktu, tekst     |
| Body small              | 14px / 0.875rem  | 400 Regular  | 1.5         | Opisy, secondary info     |
| Caption / Meta          | 12px / 0.75rem   | 400 Regular  | 1.4         | Kto dodal, kiedy          |
| Input text              | 16px / 1rem      | 400 Regular  | 1.5         | Pola formularzy           |
| Button                  | 15px / 0.9375rem | 600 SemiBold | 1           | Przyciski                 |
| Chip                    | 13px / 0.8125rem | 600 SemiBold | 1           | Filtry kategorii          |

> **Wazne:** Input na mobile musi miec min. `16px` zeby iOS nie zoomowal przy focus.

---

## 4. Spacing

**Skala:** base 4px, mnozniki

| Token        | Wartosc |
| ------------ | ------- |
| `--space-1`  | 4px     |
| `--space-2`  | 8px     |
| `--space-3`  | 12px    |
| `--space-4`  | 16px    |
| `--space-5`  | 20px    |
| `--space-6`  | 24px    |
| `--space-8`  | 32px    |
| `--space-10` | 40px    |
| `--space-12` | 48px    |

**Uzycie typowe:**

- Padding karty: `--space-4`
- Gap miedzy pozycjami listy: 0 (border-bottom separator)
- Padding pozycji: 14px 16px
- Margin naglowka kategorii: `--space-6` gora, `--space-2` dol
- Padding chipsa: 6px 14px
- Padding buttona: 12px 24px

---

## 5. Border Radius

| Token           | Wartosc | Uzycie                    |
| --------------- | ------- | ------------------------- |
| `--radius-sm`   | 8px     | Chipy, badge              |
| `--radius-md`   | 12px    | Inputy, male karty        |
| `--radius-lg`   | 16px    | Karty, modalne, dropdown  |
| `--radius-xl`   | 24px    | Duze karty, bottom sheets |
| `--radius-full` | 9999px  | Checkboxy, avatary, pills |

---

## 6. Shadows

| Token         | Wartosc                       | Uzycie                |
| ------------- | ----------------------------- | --------------------- |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)`  | Inputy, chipy         |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.06)`  | Karty, dropdown       |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.08)` | Modalne, bottom sheet |

---

## 7. Komponenty

### 7.1 Input dodawania produktu

```
+---------------------------------------------+
|  [Q]  Dodaj produkt...                  [+]  |
+---------------------------------------------+
```

| Wlasciwosc    | Wartosc                                   |
| ------------- | ----------------------------------------- |
| Tlo           | `--surface` (#FFFFFF)                     |
| Border        | 1.5px `--border` (#E8E8E4)                |
| Border-radius | `--radius-lg` (16px)                      |
| Padding       | 12px 16px                                 |
| Shadow        | `--shadow-sm`                             |
| Focus border  | `--mint-400` (#4ADE80)                    |
| Focus shadow  | `0 0 0 3px rgba(74,222,128,0.15)`         |
| Ikona search  | Lucide `Search`, `--text-tertiary`        |
| Przycisk +    | Lucide `Plus`, `--mint-500`               |
| Pozycja       | Sticky top, `backdrop-filter: blur(12px)` |
| Tlo sticky    | `rgba(250,250,248,0.85)`                  |
| Placeholder   | "Dodaj produkt...", `--text-tertiary`     |

### 7.2 Autocomplete dropdown

```
+---------------------------------------------+
|  Mleko 2%                        [N] Nabial  |
|  Mleko migdalowe                 [N] Nabial  |
|  Mleko kokosowe                  [N] Nabial  |
|---------------------------------------------|
|  + Dodaj "mleko owsie..." jako nowy         |
+---------------------------------------------+
```

| Wlasciwosc       | Wartosc                       |
| ---------------- | ----------------------------- |
| Tlo              | `--surface`                   |
| Shadow           | `--shadow-lg`                 |
| Border-radius    | `--radius-lg`                 |
| Item padding     | 12px 16px                     |
| Item hover       | `--mint-50` bg                |
| Kategoria badge  | Body small, `--text-tertiary` |
| "Dodaj nowy" tlo | `--mint-100`                  |
| Max items        | 8                             |
| Komponent bazowy | shadcn Command (cmdk)         |

### 7.3 Chipsy kategorii (filtry)

```
[Wszystko]  [Warzywa]  [Nabial]  [! Do sklasyfikowania 3]
```

**Stan nieaktywny:**

| Wlasciwosc    | Wartosc            |
| ------------- | ------------------ |
| Tlo           | `--surface`        |
| Border        | 1px `--border`     |
| Tekst         | `--text-secondary` |
| Border-radius | `--radius-full`    |
| Padding       | 6px 14px           |
| Shadow        | `--shadow-sm`      |

**Stan aktywny:**

| Wlasciwosc | Wartosc                    |
| ---------- | -------------------------- |
| Tlo        | `--mint-100` (#DCFCE8)     |
| Border     | 1px `--mint-300` (#86EFAC) |
| Tekst      | `--mint-600` (#16A34A)     |

**Chip "Do sklasyfikowania":**

| Wlasciwosc | Wartosc                    |
| ---------- | -------------------------- |
| Tlo        | `--warning` bg (#FEF3C7)   |
| Border     | 1px #FCD34D                |
| Tekst      | `--warning` text (#D97706) |
| Badge      | Liczba niesklasyfikowanych |

- Scroll horyzontalny (overflow-x: auto, no scrollbar)
- Sticky pod inputem
- Gap miedzy chipsami: `--space-2`

### 7.4 Pozycja na liscie zakupow

```
+---------------------------------------------+
|  ( )  Mleko 2%                  Kasia, 14:30 |
+---------------------------------------------+
```

| Wlasciwosc    | Wartosc              |
| ------------- | -------------------- |
| Tlo           | `--surface`          |
| Padding       | 14px 16px            |
| Border-bottom | 1px `--border-light` |
| Min-height    | 52px (touch target)  |

**Checkbox (niezaznaczony):**

| Wlasciwosc    | Wartosc                   |
| ------------- | ------------------------- |
| Rozmiar       | 24px x 24px               |
| Border        | 2px `--border`            |
| Border-radius | `--radius-full` (okragly) |
| Tlo           | transparent               |

**Checkbox (zaznaczony — animowany):**

| Wlasciwosc     | Wartosc                                              |
| -------------- | ---------------------------------------------------- |
| Tlo            | `--mint-300` (#86EFAC)                               |
| Border         | 2px `--mint-400`                                     |
| Ikona          | Lucide `Check`, bialy, 14px                          |
| Animacja fill  | scale 0 -> 1, 200ms ease-out                         |
| Animacja ikony | scale + bounce, 250ms cubic-bezier(0.34,1.56,0.64,1) |

**Tekst produktu:**

- Niezaznaczony: Body, `--text-primary`
- Zaznaczony: przekreslenie (line-through), `--text-disabled`, 150ms transition

**Meta info (kto, kiedy):**

- Caption, `--text-tertiary`
- Wyrownane do prawej
- Format: "Kasia, 14:30" lub "Kasia, 2h temu"

**Sekwencja animacji po zaznaczeniu:**

1. (0ms) Checkbox fill scale 0->1 + mint-300, 200ms ease-out
2. (50ms) Check icon pojawia sie z bounce, 250ms
3. (100ms) Tekst -> przekreslenie + text-disabled, 150ms
4. (300ms) Cala pozycja -> opacity 0.5
5. (700ms) Slide-up + fade-out, 500ms ease-in-out
6. Pozycja przenosi sie do sekcji "Kupione"

### 7.5 Naglowek kategorii na liscie

```
-- [icon] Nabial ---------------------- 3 pozycje
```

| Wlasciwosc         | Wartosc                          |
| ------------------ | -------------------------------- |
| Ikona              | Lucide, 16px, `--text-secondary` |
| Nazwa              | h3 style, `--text-secondary`     |
| Linia              | 1px `--border-light`             |
| Liczba             | Caption, `--text-tertiary`       |
| Margin top         | `--space-6` (24px)               |
| Margin bottom      | `--space-2` (8px)                |
| Padding horizontal | 16px                             |

### 7.6 Sekcja "Do sklasyfikowania"

```
+---------------------------------------------+
| |  ( )  Tahini                               |
| |       [ Wybierz kategorie v ]              |
+---------------------------------------------+
```

| Wlasciwosc         | Wartosc                                |
| ------------------ | -------------------------------------- |
| Border-left        | 3px `--warning` text (#D97706)         |
| Przycisk kategoria | Outline, `--warning` text, sm          |
| Dropdown           | Lista kategorii (ikona Lucide + nazwa) |

Po wybraniu kategorii:

- Update `shopping_items.category_id`
- Update/create w `products` (nauka na przyszlosc)
- Animacja: slideOut z tej sekcji -> slideIn do nowej

### 7.7 Sekcja "Kupione"

```
+---------------------------------------------+
|  [v] Kupione (5)                         [>] |
|---------------------------------------------|
|  [v]  -Mleko 2%-                             |
|  [v]  -Chleb-                                |
|---------------------------------------------|
|         [ Wyczysc kupione ]                  |
+---------------------------------------------+
```

| Wlasciwosc         | Wartosc                          |
| ------------------ | -------------------------------- |
| Domyslnie          | Zwinieta (collapsed)             |
| Tlo                | `--surface-raised` (#F5F5F3)     |
| Naglowek           | h2 style, "Kupione (N)"          |
| Tekst pozycji      | `--text-disabled`, line-through  |
| Klikniecie pozycji | Odznacza, wraca na liste aktywna |
| Przycisk wyczysc   | Ghost, `--error` text (#DC2626)  |
| Animacja toggle    | Height auto, 200ms ease          |

### 7.8 Bottom Navigation (mobile)

```
+---------------------------------------------+
|   [cart] Lista   [users] Rodzina   [gear] Ust.|
+---------------------------------------------+
```

| Wlasciwosc        | Wartosc                                     |
| ----------------- | ------------------------------------------- |
| Tlo               | `--surface` z `backdrop-filter: blur(12px)` |
| Tlo alpha         | `rgba(255,255,255,0.85)`                    |
| Shadow            | odwrocony `--shadow-md` (0 -2px 8px)        |
| Border-radius top | `--radius-xl` (24px)                        |
| Height            | 64px + safe-area-inset-bottom               |
| Ikony             | Lucide: `ShoppingCart`, `Users`, `Settings` |
| Ikona aktywna     | `--mint-500`, 24px                          |
| Ikona nieaktywna  | `--text-tertiary`, 24px                     |
| Label aktywny     | Chip, `--mint-500`                          |
| Label nieaktywny  | Chip, `--text-tertiary`                     |

### 7.9 Przyciski

**Primary:**

| Wlasciwosc    | Wartosc                  |
| ------------- | ------------------------ |
| Tlo           | `--mint-400` (#4ADE80)   |
| Tekst         | #FFFFFF                  |
| Border-radius | `--radius-lg` (16px)     |
| Padding       | 12px 24px                |
| Hover         | `--mint-500` (#22C55E)   |
| Active        | `--mint-600` (#16A34A)   |
| Shadow        | `--shadow-sm`            |
| Font          | Button style (15px, 600) |

**Secondary / Outline:**

| Wlasciwosc | Wartosc            |
| ---------- | ------------------ |
| Tlo        | transparent        |
| Border     | 1.5px `--border`   |
| Tekst      | `--text-primary`   |
| Hover tlo  | `--surface-raised` |

**Ghost:**

| Wlasciwosc | Wartosc            |
| ---------- | ------------------ |
| Tlo        | transparent        |
| Border     | none               |
| Tekst      | `--text-secondary` |
| Hover tlo  | `--surface-raised` |

---

## 8. Ikony — mapowanie kategorii (Lucide)

| Kategoria            | Ikona Lucide  | Fallback     |
| -------------------- | ------------- | ------------ |
| Owoce i warzywa      | `Apple`       | `Carrot`     |
| Nabial               | `Milk`        | `GlassWater` |
| Pieczywo             | `Croissant`   | `Wheat`      |
| Mieso i wedliny      | `Beef`        | `Ham`        |
| Ryby i owoce morza   | `Fish`        | -            |
| Mrozonki             | `Snowflake`   | -            |
| Napoje               | `CupSoda`     | `Wine`       |
| Slodycze i przekaski | `Cookie`      | `Candy`      |
| Przyprawy i sosy     | `FlaskRound`  | -            |
| Chemia domowa        | `SprayBottle` | `Sparkles`   |
| Higiena              | `ShowerHead`  | `Heart`      |
| Artykuly domowe      | `Home`        | `Lightbulb`  |
| Do sklasyfikowania   | `CircleHelp`  | -            |
| Inne                 | `Package`     | -            |

> Uwaga: Przy implementacji zweryfikowac dostepnosc ikon w aktualnej wersji lucide-react.
> Jesli ikona niedostepna, uzyc fallbacka lub `Package` jako domyslna.

---

## 9. Animacje i Transitions

| Element                  | Animacja              | Czas  | Easing                              | Delay |
| ------------------------ | --------------------- | ----- | ----------------------------------- | ----- |
| Checkbox fill            | Scale 0->1 + kolor    | 200ms | `ease-out`                          | 0     |
| Checkbox check icon      | Scale + bounce        | 250ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 50ms  |
| Tekst checked            | line-through + color  | 150ms | `ease`                              | 100ms |
| Pozycja checked -> znika | Opacity 0.5 + slideUp | 500ms | `ease-in-out`                       | 400ms |
| Nowa pozycja             | SlideDown + fadeIn    | 300ms | `ease-out`                          | 0     |
| Dropdown open            | ScaleY 0->1 + fadeIn  | 200ms | `ease-out`                          | 0     |
| Chip toggle              | Background color      | 150ms | `ease`                              | 0     |
| Kategoria assign         | SlideOut + SlideIn    | 400ms | `ease-in-out`                       | 0     |
| Page transition          | FadeIn                | 200ms | `ease`                              | 0     |
| Collapse toggle          | Height auto           | 200ms | `ease`                              | 0     |

**Implementacja:** CSS transitions jako domyslne, framer-motion dla list (AnimatePresence) i zlozonych sekwencji.

---

## 10. Responsive Breakpoints

| Breakpoint       | Szerokosc  | Layout                                |
| ---------------- | ---------- | ------------------------------------- |
| Mobile (default) | < 640px    | Single column, bottom nav, full-width |
| Tablet           | 640-1024px | max-w-lg center, bottom nav           |
| Desktop          | > 1024px   | Sidebar nav (lewy), max-w-2xl center  |

**Mobile (primary):**

- Input: full-width, sticky top
- Chipsy: horizontal scroll, sticky pod inputem
- Lista: full-width
- Nav: bottom, fixed

**Desktop:**

- Nav: sidebar lewy (ShoppingCart, Users, Settings)
- Content: wycentrowany, max-w-2xl
- Input: na gorze contentu (nie sticky)

---

## 11. Szkice ekranow (wireframes)

### 11.1 Ekran glowny — Lista zakupow (mobile)

```
+=======================================+
|  Cartlo                        [Kasia]|
+=======================================+
| +-----------------------------------+ |
| |  [Q] Dodaj produkt...         [+] | |
| +-----------------------------------+ |
|                                       |
| [Wszystko] [Warzywa] [Nabial]  [>>>] |
|                                       |
| -- [apple] Owoce i warzywa --- 3 --- |
| ( ) Jablka                  Kasia 14h |
| ( ) Pomidory                 Mama 12h |
| ( ) Ogorki                   Tata 10h |
|                                       |
| -- [milk] Nabial ------------- 2 --- |
| ( ) Mleko 2%                Kasia 14h |
| ( ) Jogurt naturalny        Mama 13h  |
|                                       |
| -- [?] Do sklasyfikowania --- 1 ---- |
| |( ) Tahini                           |
| |    [Wybierz kategorie v]            |
|                                       |
| [v] Kupione (3)                       |
|                                       |
+=======================================+
|  [cart]Lista  [users]Rodzina  [S]Ust. |
+=======================================+
```

### 11.2 Ekran z autocomplete

```
+=======================================+
| +-----------------------------------+ |
| |  [Q] mle|                     [+] | |
| +-----------------------------------+ |
| +-----------------------------------+ |
| |  Mleko 2%             [milk]Nabial| |
| |  Mleko 3.2%           [milk]Nabial| |
| |  Mleko migdalowe      [milk]Nabial| |
| |  Mleko kokosowe       [milk]Nabial| |
| |-----------------------------------| |
| |  + Dodaj "mle..." jako nowy      | |
| +-----------------------------------+ |
+=======================================+
```

### 11.3 Ekran rodziny

```
+=======================================+
|  Rodzina                              |
+=======================================+
|                                       |
|  Czlonkowie                           |
|  +-----------------------------------+|
|  | [K] Kasia          (Ty) - Admin   ||
|  | [M] Mama               - Czlonek  ||
|  | [T] Tata               - Czlonek  ||
|  +-----------------------------------+|
|                                       |
|  Zapros do rodziny                    |
|  +-----------------------------------+|
|  | lista.app/join/abc123             ||
|  |       [ Kopiuj link ]            ||
|  +-----------------------------------+|
|                                       |
+=======================================+
|  [cart]Lista  [users]Rodzina  [S]Ust. |
+=======================================+
```

### 11.4 Ekran logowania

```
+=======================================+
|                                       |
|          [logo/ikona]                 |
|            Cartlo                     |
|                                       |
|  +-----------------------------------+|
|  | Email                             ||
|  | [_______________________________] ||
|  |                                   ||
|  | Haslo                             ||
|  | [_______________________________] ||
|  |                                   ||
|  | [    Zaloguj sie    ] (primary)   ||
|  |                                   ||
|  | Nie masz konta? Zarejestruj sie   ||
|  +-----------------------------------+|
|                                       |
+=======================================+
```

### 11.5 Onboarding

```
+=======================================+
|                                       |
|           Witaj w Cartlo!             |
|                                       |
|  +-----------------------------------+|
|  |  Jak chcesz zaczac?              ||
|  |                                   ||
|  |  [  Utworz nowa rodzine  ] (prim) ||
|  |                                   ||
|  |  [  Mam kod zaproszeniowy ] (sec) ||
|  +-----------------------------------+|
|                                       |
+=======================================+
```

---

## 12. Tailwind Config — mapowanie tokenow

```typescript
// tailwind.config.ts — fragment extend
{
  colors: {
    background: '#FAFAF8',
    surface: {
      DEFAULT: '#FFFFFF',
      raised: '#F5F5F3',
    },
    border: {
      DEFAULT: '#E8E8E4',
      light: '#F0F0EC',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6B6B6B',
      tertiary: '#9B9B9B',
      disabled: '#C4C4C4',
    },
    mint: {
      50: '#F0FDF6',
      100: '#DCFCE8',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
    },
    warning: {
      bg: '#FEF3C7',
      text: '#D97706',
      border: '#FCD34D',
    },
    error: {
      bg: '#FEE2E2',
      text: '#DC2626',
    },
    info: {
      bg: '#E0F2FE',
      text: '#0284C7',
    },
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  boxShadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 8px rgba(0,0,0,0.06)',
    lg: '0 4px 16px rgba(0,0,0,0.08)',
  },
  fontFamily: {
    sans: ['var(--font-nunito)', 'sans-serif'],
  },
}
```

---

## 13. Dostepnosc (a11y)

- Kontrast tekstu: `--text-primary` na `--background` = 15.4:1 (AAA)
- Kontrast `--text-secondary` na `--background` = 5.2:1 (AA)
- Kontrast `--mint-500` na `--surface` = 3.2:1 (uzywac tylko dla duzego tekstu/ikon)
- Kontrast `--mint-600` na `--surface` = 4.5:1 (AA)
- Focus ring: widoczny na wszystkich interaktywnych elementach
- Checkbox: aria-checked, role="checkbox"
- Autocomplete: aria-expanded, aria-activedescendant
- Bottom nav: role="navigation", aria-current="page"
