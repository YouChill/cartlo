#!/bin/bash
# =============================================================================
# Cartlo — GitHub Issues Creator
# =============================================================================
# Uzycie: ./create-issues.sh
# Wymaga: gh CLI zalogowane (gh auth login)
# Tworzy: milestones, labels, 22 issues
# =============================================================================

set -euo pipefail

# Kolory do outputu
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Cartlo — Tworzenie GitHub Issues           ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Sprawdz czy gh jest zainstalowane i zalogowane
if ! command -v gh &> /dev/null; then
    echo "Blad: gh CLI nie jest zainstalowane. Zainstaluj: brew install gh"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "Blad: gh CLI nie jest zalogowane. Uruchom: gh auth login"
    exit 1
fi

# Sprawdz czy jestesmy w repo
if ! gh repo view &> /dev/null; then
    echo "Blad: Nie jestes w repozytorium GitHub. Najpierw utworz repo:"
    echo "  git init && gh repo create cartlo --private --source=. --push"
    exit 1
fi

# =============================================================================
# LABELS
# =============================================================================
echo -e "${YELLOW}Tworzenie labels...${NC}"

declare -A LABELS=(
    ["setup"]="d4c5f9:Konfiguracja projektu i tooling"
    ["database"]="0075ca:Schemat bazy danych, migracje, RLS"
    ["auth"]="e4e669:Autentykacja i autoryzacja"
    ["feature"]="a2eeef:Nowa funkcjonalnosc"
    ["ui"]="7057ff:Komponent UI / design"
    ["realtime"]="008672:Synchronizacja realtime"
    ["pwa"]="d93f0b:Progressive Web App"
    ["ux"]="fbca04:UX improvements, animacje"
    ["priority:high"]="b60205:Wysoki priorytet"
    ["priority:medium"]="f9d0c4:Sredni priorytet"
    ["priority:low"]="c5def5:Niski priorytet"
)

for label in "${!LABELS[@]}"; do
    IFS=':' read -r color description <<< "${LABELS[$label]}"
    gh label create "$label" --color "$color" --description "$description" --force 2>/dev/null || true
    echo -e "  ${GREEN}+${NC} $label"
done

echo ""

# =============================================================================
# MILESTONES
# =============================================================================
echo -e "${YELLOW}Tworzenie milestones...${NC}"

gh api repos/{owner}/{repo}/milestones -f title="M1: Project Setup" -f description="Inicjalizacja projektu, tooling, konfiguracja Supabase, schemat DB" -f state="open" 2>/dev/null || true
echo -e "  ${GREEN}+${NC} M1: Project Setup"

gh api repos/{owner}/{repo}/milestones -f title="M2: Auth & Family" -f description="Autentykacja, rejestracja, tworzenie rodziny, zaproszenia" -f state="open" 2>/dev/null || true
echo -e "  ${GREEN}+${NC} M2: Auth & Family"

gh api repos/{owner}/{repo}/milestones -f title="M3: Shopping List Core" -f description="Core listy zakupow: layout, widok, checkboxy, dodawanie, kupione" -f state="open" 2>/dev/null || true
echo -e "  ${GREEN}+${NC} M3: Shopping List Core"

gh api repos/{owner}/{repo}/milestones -f title="M4: Smart Features" -f description="Autocomplete, kategoryzacja, realtime sync, usage tracking" -f state="open" 2>/dev/null || true
echo -e "  ${GREEN}+${NC} M4: Smart Features"

gh api repos/{owner}/{repo}/milestones -f title="M5: Polish & PWA" -f description="Animacje, UX polish, PWA manifest i service worker" -f state="open" 2>/dev/null || true
echo -e "  ${GREEN}+${NC} M5: Polish & PWA"

echo ""

# Pobierz numery milestones
echo -e "${YELLOW}Pobieranie numerow milestones...${NC}"
M1=$(gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.title=="M1: Project Setup") | .number')
M2=$(gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.title=="M2: Auth & Family") | .number')
M3=$(gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.title=="M3: Shopping List Core") | .number')
M4=$(gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.title=="M4: Smart Features") | .number')
M5=$(gh api repos/{owner}/{repo}/milestones --jq '.[] | select(.title=="M5: Polish & PWA") | .number')

echo -e "  M1=$M1, M2=$M2, M3=$M3, M4=$M4, M5=$M5"
echo ""

# =============================================================================
# ISSUES
# =============================================================================
echo -e "${YELLOW}Tworzenie issues...${NC}"
echo ""

# -----------------------------------------------------------------------------
# M1: Project Setup
# -----------------------------------------------------------------------------
echo -e "${BLUE}--- M1: Project Setup ---${NC}"

gh issue create \
  --title "Inicjalizacja projektu Next.js + TypeScript + Tailwind" \
  --milestone "$M1" \
  --label "setup,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Utworzenie projektu Next.js 14+ z App Router jako fundament aplikacji.

## Zadania
- [ ] `npx create-next-app@latest` z TypeScript, Tailwind, ESLint, App Router
- [ ] Konfiguracja TypeScript strict mode (`strict: true` w tsconfig)
- [ ] Setup Prettier + integracja z ESLint
- [ ] Utworzenie struktury folderow:
  ```
  app/
    (app)/          # Protected routes (lista, rodzina, ustawienia)
    (auth)/         # Auth routes (login, join)
    layout.tsx
    globals.css
  components/
    ui/             # shadcn/ui components
    shopping/       # Komponenty listy zakupow
    layout/         # Layout components (nav, header)
  lib/
    supabase/       # Supabase client helpers
    utils.ts        # Utility functions
  types/
    database.ts     # Typy z Supabase (generated)
  hooks/            # Custom React hooks
  ```
- [ ] `.gitignore` (node_modules, .next, .env.local)
- [ ] `.env.local.example` z placeholderami

## Acceptance Criteria
- Projekt buduje sie bez bledow (`npm run build`)
- Struktura folderow jest zgodna z powyzszym schematem
- TypeScript strict mode wlaczony
- ESLint + Prettier skonfigurowane
EOF
)"
echo -e "  ${GREEN}#1${NC} Inicjalizacja projektu Next.js + TypeScript + Tailwind"

gh issue create \
  --title "Konfiguracja shadcn/ui + Nunito font + Design tokens" \
  --milestone "$M1" \
  --label "setup,ui,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Konfiguracja warstwy wizualnej zgodnie z Design System (patrz `DESIGN_SYSTEM.md`).

## Zadania
- [ ] Instalacja shadcn/ui (`npx shadcn@latest init`)
- [ ] Konfiguracja fontu Nunito via `next/font/google` z subset `latin-ext`
- [ ] Utworzenie design tokenow w `globals.css`:
  - Kolory bazowe (background, surface, border)
  - Kolory tekstu (primary, secondary, tertiary, disabled)
  - Mietowy akcent (mint-50 do mint-600)
  - Kolory statusowe (warning, error, info)
  - Spacing scale (space-1 do space-12)
  - Border radius (sm, md, lg, xl, full)
  - Shadows (sm, md, lg)
- [ ] Konfiguracja Tailwind theme extend z tokenami (patrz sekcja 12 w DESIGN_SYSTEM.md)
- [ ] Instalacja bazowych komponentow shadcn: Button, Input, Badge, Command
- [ ] Konfiguracja shadcn z custom theme (mint jako primary)

## Acceptance Criteria
- Font Nunito laduje sie poprawnie (400, 600, 700)
- Design tokeny dostepne jako CSS variables i w Tailwind
- Komponenty shadcn uzywaja custom theme
- Brak CLS (Cumulative Layout Shift) przy ladowaniu fontu

## Referencje
- `DESIGN_SYSTEM.md` sekcje 2-6, 12
EOF
)"
echo -e "  ${GREEN}#2${NC} Konfiguracja shadcn/ui + Nunito font + Design tokens"

gh issue create \
  --title "Setup Supabase — projekt, klient, env" \
  --milestone "$M1" \
  --label "setup,database,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Konfiguracja Supabase jako backend (auth, database, realtime).

## Zadania
- [ ] Utworzenie projektu Supabase (dashboard lub `supabase init` dla lokalnego dev)
- [ ] Instalacja zaleznosci: `@supabase/supabase-js`, `@supabase/ssr`
- [ ] Helper klienta browser: `lib/supabase/client.ts`
  ```typescript
  import { createBrowserClient } from '@supabase/ssr'
  export function createClient() { ... }
  ```
- [ ] Helper klienta server: `lib/supabase/server.ts`
  ```typescript
  import { createServerClient } from '@supabase/ssr'
  export function createClient() { ... }
  ```
- [ ] Zmienne env w `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Aktualizacja `.env.local.example`
- [ ] Wygenerowanie typow TypeScript z Supabase (`supabase gen types typescript`)

## Acceptance Criteria
- Klient Supabase dziala w Server Components i Client Components
- Typy TypeScript wygenerowane i importowalne
- Zmienne env poprawnie skonfigurowane
- Brak wyciekow klucza (tylko ANON_KEY po stronie klienta)
EOF
)"
echo -e "  ${GREEN}#3${NC} Setup Supabase — projekt, klient, env"

gh issue create \
  --title "Schemat bazy danych — migracje + seed kategorii i produktow" \
  --milestone "$M1" \
  --label "database,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Utworzenie pelnego schematu bazy danych z RLS policies i seed data.

## Schemat tabel

### families
| Kolumna | Typ | Opis |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| name | text NOT NULL | Nazwa rodziny |
| invite_code | text UNIQUE NOT NULL | Kod zaproszeniowy (nanoid 8) |
| created_at | timestamptz | default now() |

### profiles
| Kolumna | Typ | Opis |
|---|---|---|
| id | uuid PK FK auth.users | 1:1 z auth.users |
| family_id | uuid FK families | nullable — null = brak rodziny |
| display_name | text NOT NULL | Imie wyswietlane |
| created_at | timestamptz | default now() |

### categories
| Kolumna | Typ | Opis |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | np. "Nabial" |
| icon | text NOT NULL | Nazwa ikony Lucide |
| sort_order | int NOT NULL | Kolejnosc wyswietlania |
| is_default | boolean | true = predefiniowana |
| family_id | uuid FK families | null = globalna |

### products
| Kolumna | Typ | Opis |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | Nazwa produktu |
| category_id | uuid FK categories | |
| family_id | uuid FK families | null = globalny |
| usage_count | int DEFAULT 0 | Popularnosc |
| UNIQUE(name, family_id) | | |

### shopping_items
| Kolumna | Typ | Opis |
|---|---|---|
| id | uuid PK | |
| family_id | uuid FK families NOT NULL | |
| product_name | text NOT NULL | |
| category_id | uuid FK categories | nullable |
| is_checked | boolean DEFAULT false | |
| added_by | uuid FK profiles NOT NULL | |
| checked_by | uuid FK profiles | nullable |
| created_at | timestamptz DEFAULT now() | |
| checked_at | timestamptz | nullable |

## Zadania
- [ ] Migracja: utworzenie tabel
- [ ] Indeksy na: `shopping_items(family_id)`, `shopping_items(family_id, is_checked)`, `products(name, family_id)`, `families(invite_code)`
- [ ] RLS policies:
  - families: users can read their own family
  - profiles: users can read family members, update own
  - categories: read all where family_id is null OR matches user family
  - products: read all where family_id is null OR matches user family
  - shopping_items: full CRUD only for own family
- [ ] Trigger: auto-create profile on auth.users insert
- [ ] Seed: 13 predefiniowanych kategorii
- [ ] Seed: ~100-150 produktow z przypisanymi kategoriami

### Seed kategorii
| Nazwa | Ikona | sort_order |
|---|---|---|
| Owoce i warzywa | Apple | 1 |
| Nabial | Milk | 2 |
| Pieczywo | Croissant | 3 |
| Mieso i wedliny | Beef | 4 |
| Ryby i owoce morza | Fish | 5 |
| Mrozonki | Snowflake | 6 |
| Napoje | CupSoda | 7 |
| Slodycze i przekaski | Cookie | 8 |
| Przyprawy i sosy | FlaskRound | 9 |
| Chemia domowa | SprayBottle | 10 |
| Higiena | ShowerHead | 11 |
| Artykuly domowe | Home | 12 |
| Inne | Package | 13 |

## Acceptance Criteria
- Wszystkie tabele utworzone z poprawnymi relacjami
- RLS policies dzialaja (user widzi tylko dane swojej rodziny)
- Seed data zaladowane (13 kategorii, 100+ produktow)
- Trigger auto-create profile dziala
- Typy TypeScript zaktualizowane po migracji
EOF
)"
echo -e "  ${GREEN}#4${NC} Schemat bazy danych — migracje + seed"

echo ""

# -----------------------------------------------------------------------------
# M2: Auth & Family
# -----------------------------------------------------------------------------
echo -e "${BLUE}--- M2: Auth & Family ---${NC}"

gh issue create \
  --title "Strona logowania i rejestracji" \
  --milestone "$M2" \
  --label "auth,ui,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Formularz logowania/rejestracji z Supabase Auth.

## Zadania
- [ ] Strona `/login` z formularzem
- [ ] Toggle miedzy trybem "Zaloguj sie" / "Zarejestruj sie"
- [ ] Pola: email, haslo (+ powtorz haslo przy rejestracji)
- [ ] Supabase Auth: `signUp` / `signInWithPassword`
- [ ] Walidacja:
  - Email: poprawny format
  - Haslo: min 6 znakow
  - Powtorz haslo: musi sie zgadzac
- [ ] Obsluga bledow: zly email/haslo, zajety email, siec
- [ ] Layout auth: wycentrowany, logo/nazwa aplikacji, mint akcenty
- [ ] Redirect po zalogowaniu:
  - Ma rodzine -> `/`
  - Nie ma rodziny -> `/onboarding`
- [ ] Loading state na przycisku

## Wireframe
```
+=======================================+
|                                       |
|          [ikona koszyka]              |
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
+=======================================+
```

## Acceptance Criteria
- Mozna sie zarejestrowac nowym emailem
- Mozna sie zalogowac istniejacym kontem
- Bledy sa czytelnie wyswietlane
- Redirect dziala poprawnie (z/bez rodziny)
- Design zgodny z DESIGN_SYSTEM.md

## Referencje
- DESIGN_SYSTEM.md sekcja 11.4
EOF
)"
echo -e "  ${GREEN}#5${NC} Strona logowania i rejestracji"

gh issue create \
  --title "Middleware auth + protected routes" \
  --milestone "$M2" \
  --label "auth,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Next.js middleware sprawdzajacy sesje Supabase i chroniacy routes.

## Zadania
- [ ] `middleware.ts` w root projektu
- [ ] Sprawdzanie sesji Supabase (cookie-based)
- [ ] Routing rules:
  - Niezalogowani -> redirect na `/login`
  - Zalogowani bez rodziny -> redirect na `/onboarding`
  - Zalogowani z rodzina -> dostep do `/(app)/*`
- [ ] Publiczne routes (bez redirectu): `/login`, `/join/[code]`
- [ ] Cookie-based session refresh (Supabase SSR)
- [ ] Matcher config: nie obsluguj statycznych plikow, API routes

## Acceptance Criteria
- Niezalogowany user nie ma dostepu do listy zakupow
- Zalogowany bez rodziny jest kierowany na onboarding
- Sesja jest odswiezana automatycznie
- Publiczne routes sa dostepne bez logowania
EOF
)"
echo -e "  ${GREEN}#6${NC} Middleware auth + protected routes"

gh issue create \
  --title "Onboarding — tworzenie rodziny" \
  --milestone "$M2" \
  --label "auth,feature,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Ekran po pierwszym logowaniu - tworzenie rodziny lub dolaczanie do istniejacej.

## Zadania
- [ ] Strona `/onboarding`
- [ ] Dwie opcje: "Utworz nowa rodzine" / "Mam kod zaproszeniowy"
- [ ] Formularz tworzenia rodziny:
  - Nazwa rodziny (text input)
  - Twoje imie / display name (text input)
- [ ] Generowanie unikalnego `invite_code` (nanoid, 8 znakow, url-safe)
- [ ] Zapis: INSERT `families` + UPDATE `profiles.family_id`
- [ ] Po utworzeniu: wyswietlenie linku zaproszeniowego z przyciskiem "Kopiuj"
- [ ] Przycisk "Przejdz do listy" -> redirect na `/`
- [ ] Opcja "Mam kod" -> redirect na `/join` z inputem na kod

## Wireframe
```
+=======================================+
|           Witaj w Cartlo!             |
|                                       |
|  +-----------------------------------+|
|  |  Jak chcesz zaczac?              ||
|  |                                   ||
|  |  [  Utworz nowa rodzine  ] (prim) ||
|  |                                   ||
|  |  [  Mam kod zaproszeniowy ] (sec) ||
|  +-----------------------------------+|
+=======================================+
```

## Acceptance Criteria
- Mozna utworzyc rodzine z unikalna nazwa
- Invite code jest unikalny i url-safe
- Profile zostaje przypisany do rodziny
- Link zaproszeniowy jest poprawny i kopiowalny
EOF
)"
echo -e "  ${GREEN}#7${NC} Onboarding — tworzenie rodziny"

gh issue create \
  --title "Dolaczanie do rodziny przez link zaproszeniowy" \
  --milestone "$M2" \
  --label "auth,feature,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Obsluga linku zaproszeniowego `/join/[code]` — dolaczanie do istniejacej rodziny.

## Zadania
- [ ] Strona `/join/[code]`
- [ ] Jesli niezalogowany:
  - Zapisz kod w query param / cookie
  - Redirect na `/login?join=CODE`
  - Po zalogowaniu wroc do `/join/CODE`
- [ ] Walidacja kodu:
  - Szukaj w `families` po `invite_code`
  - Nie znaleziono -> blad "Nieprawidlowy kod zaproszeniowy"
  - Znaleziono -> wyswietl nazwe rodziny
- [ ] Formularz dolaczania:
  - Wyswietl: "Dolacz do rodziny: [nazwa]"
  - Input: Twoje imie (display_name) jesli brak
  - Przycisk: "Dolacz"
- [ ] Logika dolaczania:
  - UPDATE `profiles.family_id`
  - UPDATE `profiles.display_name` jesli podano
- [ ] Edge cases:
  - User juz jest w rodzinie -> "Juz nalezysz do rodziny"
  - Nieprawidlowy kod -> czytelny blad
  - User nie jest zalogowany -> redirect na login z zachowaniem kodu
- [ ] Ekran sukcesu: "Dolaczyles do rodziny [nazwa]!" + przycisk "Przejdz do listy"

## Acceptance Criteria
- Link zaproszeniowy dziala dla nowych i istniejacych userow
- Kod jest walidowany po stronie serwera
- Edge cases sa obslugiwane czytelnie
- Po dolaczeniu user widzi liste zakupow rodziny
EOF
)"
echo -e "  ${GREEN}#8${NC} Dolaczanie do rodziny przez link zaproszeniowy"

gh issue create \
  --title "Ekran zarzadzania rodzina" \
  --milestone "$M2" \
  --label "feature,ui,priority:medium" \
  --body "$(cat <<'EOF'
## Opis
Strona `/family` z lista czlonkow i zarzadzaniem zaproszeniami.

## Zadania
- [ ] Strona `/(app)/family/page.tsx`
- [ ] Lista czlonkow rodziny:
  - Avatar (inicjaly w kole, mint bg) + display_name
  - Oznaczenie "(Ty)" przy biezacym userze
  - Rola: Admin (tworca) / Czlonek
- [ ] Sekcja "Zapros do rodziny":
  - Pelny link zaproszeniowy (tekstem)
  - Przycisk "Kopiuj link" (Clipboard API + feedback "Skopiowano!")
- [ ] Przycisk "Generuj nowy link":
  - Nowy invite_code (invaliduje stary)
  - Potwierdzenie: "Stary link przestanie dzialac"
- [ ] Nazwa rodziny na gorze
- [ ] Loading state

## Wireframe
```
+=======================================+
|  Rodzina Kowalskich                   |
+=======================================+
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
|  [ Generuj nowy link ]               |
+=======================================+
```

## Acceptance Criteria
- Lista czlonkow wyswietla sie poprawnie
- Kopiowanie linku dziala (Clipboard API)
- Generowanie nowego linku dziala + stary jest nieaktywny
- Design zgodny z DESIGN_SYSTEM.md sekcja 11.3
EOF
)"
echo -e "  ${GREEN}#9${NC} Ekran zarzadzania rodzina"

echo ""

# -----------------------------------------------------------------------------
# M3: Shopping List Core
# -----------------------------------------------------------------------------
echo -e "${BLUE}--- M3: Shopping List Core ---${NC}"

gh issue create \
  --title "Komponent layout aplikacji + bottom navigation" \
  --milestone "$M3" \
  --label "ui,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Glowny layout aplikacji z responsywna nawigacja.

## Zadania
- [ ] Layout `app/(app)/layout.tsx` — wrappuje wszystkie chronione strony
- [ ] Bottom navigation (mobile < 1024px):
  - 3 zakladki: Lista (ShoppingCart), Rodzina (Users), Ustawienia (Settings)
  - Ikony Lucide 24px
  - Aktywna zakladka: mint-500 (ikona + label)
  - Nieaktywna: text-tertiary
  - Tlo: surface z backdrop-filter blur(12px)
  - Shadow: odwrocony shadow-md
  - Border-radius top: radius-xl
  - Height: 64px + safe-area-inset-bottom (iOS)
- [ ] Sidebar navigation (desktop >= 1024px):
  - Lewy sidebar zamiast bottom nav
  - Te same 3 pozycje
  - Logo/nazwa aplikacji na gorze
- [ ] Header:
  - Tytul strony (h1) + avatar/imie usera (prawy rog)
  - Mobile: mniejszy padding
- [ ] Safe area handling (iOS env vars w CSS)
- [ ] Content area: max-w-lg (tablet), max-w-2xl (desktop), centered

## Acceptance Criteria
- Bottom nav wyswietla sie na mobile, sidebar na desktop
- Aktywna zakladka jest podswietlona
- Safe area dziala na iOS (brak overlapa z gestami)
- Layout jest responsywny (mobile -> tablet -> desktop)
- Nawigacja miedzy stronami dziala (Next.js Link)

## Referencje
- DESIGN_SYSTEM.md sekcja 7.8, 10
EOF
)"
echo -e "  ${GREEN}#10${NC} Layout aplikacji + bottom navigation"

gh issue create \
  --title "Widok listy zakupow pogrupowany wg kategorii" \
  --milestone "$M3" \
  --label "feature,ui,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Glowna strona aplikacji — lista zakupow pogrupowana po kategoriach.

## Zadania
- [ ] Strona `/(app)/page.tsx` (lub `/(app)/list/page.tsx`)
- [ ] Fetch `shopping_items` z JOIN na `categories` WHERE `family_id` = current AND `is_checked` = false
- [ ] Grupowanie pozycji po `category_id`
- [ ] Rendering naglowkow kategorii:
  - Ikona Lucide (z mapowania w DESIGN_SYSTEM.md sekcja 8)
  - Nazwa kategorii
  - Separator (linia)
  - Liczba pozycji
  - Styl: h3, text-secondary
- [ ] Sekcja "Do sklasyfikowania" (category_id = null):
  - Na gorze listy (przed innymi kategoriami)
  - Wyrozniona stylem warning (border-left 3px)
  - Ikona: CircleHelp
- [ ] Sortowanie kategorii wg `sort_order` z tabeli `categories`
- [ ] Empty state: "Lista jest pusta — dodaj pierwszy produkt!" z ikona koszyka
- [ ] Loading state: skeleton (shimmer placeholders)
- [ ] Error state: "Nie udalo sie zaladowac listy. Sprobuj ponownie."

## Acceptance Criteria
- Pozycje sa poprawnie pogrupowane wg kategorii
- Niesklasyfikowane sa na gorze
- Pusta lista wyswietla friendly empty state
- Loading i error states sa obslugiwane
- Dane odswiezaja sie po powrocie na strone

## Referencje
- DESIGN_SYSTEM.md sekcja 7.5, 7.6, 11.1
EOF
)"
echo -e "  ${GREEN}#11${NC} Widok listy zakupow pogrupowany wg kategorii"

gh issue create \
  --title "Komponent pozycji na liscie z checkboxem" \
  --milestone "$M3" \
  --label "ui,feature,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Komponent `ShoppingItem` — pojedyncza pozycja na liscie z okraglym checkboxem.

## Zadania
- [ ] Komponent `components/shopping/ShoppingItem.tsx`
- [ ] Okragly checkbox:
  - 24px, border 2px `--border`
  - border-radius: full
  - Niezaznaczony: transparent bg
  - Zaznaczony: mint-300 bg, Check icon (Lucide, bialy, 14px)
- [ ] Nazwa produktu: body, text-primary
- [ ] Meta info po prawej: "Kasia, 14:30" / "2h temu"
  - Caption, text-tertiary
  - Formatowanie czasu: wzgledne (<24h: "Xh temu") lub godzina
- [ ] Toggle `is_checked`:
  - Supabase UPDATE `shopping_items` SET is_checked, checked_by, checked_at
  - Optimistic update (UI reaguje natychmiast, rollback przy bledzie)
- [ ] Checked items przesuwaja sie do sekcji "Kupione"
- [ ] Touch target: min 44px height (padding 14px 16px)
- [ ] Podstawowa wersja — BEZ animacji (animacje w issue #20)

## Acceptance Criteria
- Checkbox toggle dziala (zaznacz/odznacz)
- Optimistic update — brak lag przy zaznaczaniu
- Meta info wyswietla poprawne dane
- Touch target wystarczajaco duzy na mobile
- Rollback przy bledzie sieciowym

## Referencje
- DESIGN_SYSTEM.md sekcja 7.4
EOF
)"
echo -e "  ${GREEN}#12${NC} Komponent pozycji z checkboxem"

gh issue create \
  --title "Chipsy filtrujace kategorii" \
  --milestone "$M3" \
  --label "ui,feature,priority:medium" \
  --body "$(cat <<'EOF'
## Opis
Horyzontalny scroll z chipsami do filtrowania listy wg kategorii.

## Zadania
- [ ] Komponent `components/shopping/CategoryFilters.tsx`
- [ ] Chip "Wszystko" — domyslnie aktywny
- [ ] Chip per kategoria — tylko te ktore maja pozycje na liscie
- [ ] Chip "Do sklasyfikowania" — z badge (liczba niesklasyfikowanych)
- [ ] Style:
  - Nieaktywny: surface bg, border, text-secondary
  - Aktywny: mint-100 bg, mint-300 border, mint-600 text
  - Warning: FEF3C7 bg, FCD34D border, D97706 text
  - Radius: full, padding: 6px 14px
- [ ] Horyzontalny scroll:
  - `overflow-x: auto`
  - Ukryty scrollbar (`scrollbar-width: none`)
  - Smooth scroll snap (opcjonalnie)
- [ ] Sticky pod inputem (razem z inputem tworza sticky header)
- [ ] Gap miedzy chipsami: 8px
- [ ] Filtrowanie: klikniecie chipsa filtruje liste (local state)
- [ ] Ilosc przy kazdym chipsie (opcjonalnie): "(3)"

## Acceptance Criteria
- Chipsy scrolluja sie horyzontalnie na mobile
- Filtrowanie dziala poprawnie
- "Wszystko" pokazuje cala liste
- Badge na "Do sklasyfikowania" pokazuje poprawna liczbe
- Chipsy sa sticky pod inputem
- Style zgodne z DESIGN_SYSTEM.md

## Referencje
- DESIGN_SYSTEM.md sekcja 7.3
EOF
)"
echo -e "  ${GREEN}#13${NC} Chipsy filtrujace kategorii"

gh issue create \
  --title "Sekcja Kupione — zwijana lista zaznaczonych pozycji" \
  --milestone "$M3" \
  --label "feature,ui,priority:medium" \
  --body "$(cat <<'EOF'
## Opis
Collapsible sekcja na dole listy z zaznaczonymi (kupionymi) pozycjami.

## Zadania
- [ ] Komponent `components/shopping/CheckedSection.tsx`
- [ ] Naglowek: "Kupione (N)" z ikoną chevron (Lucide ChevronDown/ChevronUp)
- [ ] Domyslnie zwinieta
- [ ] Po rozwinieciu:
  - Lista checked items
  - Tekst: text-disabled, line-through
  - Checkbox: zaznaczony (mint-300)
  - Tlo sekcji: surface-raised
- [ ] Klikniecie pozycji -> odznaczenie:
  - `is_checked = false`, `checked_by = null`, `checked_at = null`
  - Pozycja wraca na liste aktywna (do odpowiedniej kategorii)
  - Optimistic update
- [ ] Przycisk "Wyczysc kupione":
  - Ghost button, error text (#DC2626)
  - DELETE wszystkich checked items z bazy
  - Dialog potwierdzenia: "Czy na pewno chcesz usunac N kupionych pozycji?"
- [ ] Animacja toggle (collapse/expand): height transition 200ms ease

## Acceptance Criteria
- Sekcja jest domyslnie zwinieta
- Toggle collapse/expand dziala plynnie
- Odznaczanie pozycji przenosi ja z powrotem na liste
- "Wyczysc kupione" wymaga potwierdzenia i usuwa pozycje
- Liczba w naglowku jest poprawna

## Referencje
- DESIGN_SYSTEM.md sekcja 7.7
EOF
)"
echo -e "  ${GREEN}#14${NC} Sekcja Kupione"

gh issue create \
  --title "Dodawanie produktu — podstawowy input + Enter" \
  --milestone "$M3" \
  --label "feature,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Sticky input do dodawania produktow na liste. Wersja podstawowa (bez autocomplete).

## Zadania
- [ ] Komponent `components/shopping/AddProductInput.tsx`
- [ ] Sticky na gorze strony z backdrop blur
- [ ] Ikona Search (Lucide) + placeholder "Dodaj produkt..."
- [ ] Enter -> dodaje produkt:
  1. Szukaj w `products` po `name` (case-insensitive, ILIKE)
  2. Znaleziono -> uzyj `category_id` z `products`, increment `usage_count`
  3. Nie znaleziono -> `category_id = null`, dodaj do `products` (nowy, usage_count=1)
  4. INSERT do `shopping_items` (product_name, category_id, family_id, added_by)
- [ ] Przycisk "+" (Lucide Plus) po prawej — alternatywny sposob dodania
- [ ] Clear input po dodaniu
- [ ] Focus management: zachowaj focus po dodaniu (kolejne dodawanie bez klikania)
- [ ] Walidacja:
  - Nie dodawaj pustych (trim)
  - Nie dodawaj duplikatow (ten sam product_name juz na aktywnej liscie)
  - Pokazuj blad "Ten produkt juz jest na liscie"
- [ ] Optimistic update: pozycja pojawia sie natychmiast na liscie
- [ ] Style zgodne z DESIGN_SYSTEM.md sekcja 7.1

## Acceptance Criteria
- Enter dodaje produkt na liste
- Auto-kategoryzacja dziala (znany produkt -> przypisana kategoria)
- Nowy produkt ląduje w "Do sklasyfikowania"
- Duplikaty sa blokowane
- Input zachowuje focus po dodaniu
- Optimistic update (brak lagów)

## Referencje
- DESIGN_SYSTEM.md sekcja 7.1
EOF
)"
echo -e "  ${GREEN}#15${NC} Dodawanie produktu — input + Enter"

echo ""

# -----------------------------------------------------------------------------
# M4: Smart Features
# -----------------------------------------------------------------------------
echo -e "${BLUE}--- M4: Smart Features ---${NC}"

gh issue create \
  --title "Autocomplete — podpowiedzi z bazy produktow" \
  --milestone "$M4" \
  --label "feature,ui,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Rozszerzenie inputa o autocomplete z podpowiedziami z bazy produktow.

## Zadania
- [ ] Komponent autocomplete oparty na shadcn Command (cmdk)
- [ ] Wyszukiwanie w `products` po nazwie:
  - Debounced: 200ms
  - Case-insensitive (ILIKE)
  - Filtr: `family_id IS NULL OR family_id = current`
  - Sortowanie: `usage_count DESC`
  - Limit: 8 wynikow
- [ ] Kazdy wynik:
  - Nazwa produktu (body)
  - Badge kategorii: ikona Lucide + nazwa kategorii (text-tertiary)
- [ ] Opcja "Dodaj [wpisany tekst] jako nowy" na koncu listy:
  - Tlo: mint-100
  - Zawsze widoczna gdy user pisze cos czego nie ma w wynikach
- [ ] Interakcja:
  - Klikniecie/Enter na wynik -> dodaj na liste z kategoria
  - Klikniecie "Dodaj jako nowy" -> dodaj bez kategorii
  - Escape -> zamknij dropdown
  - Keyboard navigation: arrow up/down, Enter
- [ ] Dropdown zamyka sie po dodaniu
- [ ] Dropdown otwiera sie automatycznie gdy user zaczyna pisac (min 1 znak)

## Acceptance Criteria
- Podpowiedzi pojawiaja sie po wpisaniu 1+ znakow
- Debounce 200ms (brak spamu requestow)
- Wyniki posortowane wg popularnosci
- Keyboard navigation dziala
- Wybranie podpowiedzi dodaje produkt z kategoria
- "Dodaj jako nowy" dziala dla nieznanych produktow

## Referencje
- DESIGN_SYSTEM.md sekcja 7.2
EOF
)"
echo -e "  ${GREEN}#16${NC} Autocomplete"

gh issue create \
  --title "Klasyfikacja nierozpoznanych produktow" \
  --milestone "$M4" \
  --label "feature,ui,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Mechanizm przypisywania kategorii do niesklasyfikowanych produktow (category_id = null).

## Zadania
- [ ] Pozycje z `category_id = null` wyroznione:
  - Border-left: 3px #D97706 (warning)
  - Pod nazwa: przycisk "Wybierz kategorie" (outline, warning color, sm)
- [ ] Klikniecie "Wybierz kategorie":
  - Dropdown/popover z lista kategorii
  - Kazda kategoria: ikona Lucide + nazwa
  - Sortowane wg `sort_order`
- [ ] Po wybraniu kategorii:
  - UPDATE `shopping_items.category_id` (ta pozycja)
  - UPSERT `products` — przypisz kategorie do produktu (nauka na przyszlosc):
    - Jesli produkt istnieje w `products` -> UPDATE `category_id`
    - Jesli nie -> INSERT z `category_id` i `usage_count = 1`
  - Pozycja przenosi sie do odpowiedniej sekcji kategorii
  - Optimistic update
- [ ] Chip "Do sklasyfikowania" — badge z liczba zmniejsza sie
- [ ] Jesli to ostatni niesklasyfikowany -> sekcja "Do sklasyfikowania" znika

## Acceptance Criteria
- Niesklasyfikowane pozycje sa wizualnie wyroznione
- Dropdown kategorii wyswietla sie poprawnie
- Po wybraniu: pozycja przenosi sie do kategorii
- Produkt jest "zapamietany" w bazie (nastepnym razem auto-kategoryzacja)
- Badge na chipsie aktualizuje sie

## Referencje
- DESIGN_SYSTEM.md sekcja 7.6
EOF
)"
echo -e "  ${GREEN}#17${NC} Klasyfikacja nierozpoznanych produktow"

gh issue create \
  --title "Supabase Realtime — synchronizacja listy miedzy urzadzeniami" \
  --milestone "$M4" \
  --label "realtime,feature,priority:high" \
  --body "$(cat <<'EOF'
## Opis
Synchronizacja listy zakupow w czasie rzeczywistym miedzy czlonkami rodziny.

## Zadania
- [ ] Supabase Realtime subscription na tabeli `shopping_items`
- [ ] Filtr: `family_id=eq.{current_family_id}`
- [ ] Obsluga eventow:
  - **INSERT**: nowa pozycja pojawia sie na liscie (jesli dodana przez kogos innego)
  - **UPDATE**: zmiana is_checked, category_id — aktualizacja UI
  - **DELETE**: usuniecie pozycji (wyczysc kupione)
- [ ] Optimistic updates:
  - Lokalne zmiany: UI reaguje natychmiast
  - Zapis do Supabase w tle
  - Rollback jesli blad
- [ ] Remote changes:
  - Merge z lokalnym stanem
  - Nie nadpisuj zmian ktore user wlasnie zrobil
- [ ] Reconnect logic:
  - Auto-reconnect po utracie polaczenia
  - Full re-fetch po reconnect (zeby nie zgubic zmian)
- [ ] Hook: `useShoppingList(familyId)` — centralna logika
  - Zwraca: items, addItem, toggleItem, deleteChecked, assignCategory
  - Obsluguje: fetch, realtime, optimistic updates
- [ ] (Opcjonalnie) Indicator: "Kasia wlasnie edytuje liste" (Supabase Presence)

## Acceptance Criteria
- Dodanie pozycji na telefonie A -> pojawia sie na telefonie B w <2s
- Zaznaczenie checkboxa -> widoczne u drugiego usera w <2s
- Nie ma duplikatow ani zagubionych zmian
- Reconnect dziala po utracie i odzyskaniu sieci
- Optimistic updates — brak lagow na urzadzeniu ktore robi zmiane
EOF
)"
echo -e "  ${GREEN}#18${NC} Supabase Realtime"

gh issue create \
  --title "Inkrementacja usage_count + sortowanie podpowiedzi wg popularnosci" \
  --milestone "$M4" \
  --label "feature,priority:medium" \
  --body "$(cat <<'EOF'
## Opis
Tracking popularnosci produktow i wykorzystanie do sortowania podpowiedzi.

## Zadania
- [ ] Przy dodawaniu produktu z autocomplete:
  - `products.usage_count++` (UPDATE ... SET usage_count = usage_count + 1)
- [ ] Przy dodawaniu nowego produktu:
  - INSERT z `usage_count = 1`
- [ ] Podpowiedzi (autocomplete) sortowane wg `usage_count DESC`
- [ ] Rozwazyc osobny count per family:
  - Opcja A: Jedna kolumna `usage_count` (globalny)
  - Opcja B: Dodatkowa tabela `product_family_usage(product_id, family_id, count)`
  - Rekomendacja: zacznij od opcji A, refactor jesli potrzebne
- [ ] Najczesciej uzywane produkty pojawiaja sie pierwsze
- [ ] (Opcjonalnie) Waga recency: produkty uzywane ostatnio wyzej niz dawno nieuzywane

## Acceptance Criteria
- Po dodaniu produktu jego usage_count rosnie
- Autocomplete sortuje wg popularnosci
- Czesto dodawane produkty sa na gorze podpowiedzi
EOF
)"
echo -e "  ${GREEN}#19${NC} Inkrementacja usage_count"

echo ""

# -----------------------------------------------------------------------------
# M5: Polish & PWA
# -----------------------------------------------------------------------------
echo -e "${BLUE}--- M5: Polish & PWA ---${NC}"

gh issue create \
  --title "Animacje checkbox + znikanie pozycji z listy" \
  --milestone "$M5" \
  --label "ux,ui,priority:medium" \
  --body "$(cat <<'EOF'
## Opis
Implementacja animacji zaznaczania pozycji zgodnie z Design System.

## Sekwencja animacji po zaznaczeniu

1. **(0ms)** Checkbox fill: scale 0->1 + mint-300 bg, 200ms ease-out
2. **(50ms)** Check icon: scale + bounce, 250ms cubic-bezier(0.34, 1.56, 0.64, 1)
3. **(100ms)** Tekst: line-through + color text-disabled, 150ms ease
4. **(300ms)** Cala pozycja: opacity 0.5
5. **(700ms)** Slide-up + fade-out: 500ms ease-in-out
6. Pozycja przenosi sie do "Kupione"

## Sekwencja po odznaczeniu (z sekcji "Kupione")
1. Slide-down + fadeIn: 300ms ease-out
2. Pozycja pojawia sie w odpowiedniej kategorii

## Zadania
- [ ] CSS transitions lub framer-motion dla checkbox fill + check icon
- [ ] Animacja tekstu (line-through + color transition)
- [ ] Animacja znikania (opacity + translate-y + height collapse)
- [ ] Timing: delay miedzy krokami (staggered)
- [ ] AnimatePresence (framer-motion) dla listy — plynne dodawanie/usuwanie
- [ ] Animacja odznaczania (slide-down z sekcji kupione)
- [ ] Testowanie na mobile (60fps, brak jank)
- [ ] Respektuj `prefers-reduced-motion` (wylacz animacje)

## Acceptance Criteria
- Animacja jest plynna (60fps na mobile)
- Sekwencja animacji jest zgodna z Design System
- Reduced motion jest respektowane
- Animacja nie blokuje interakcji (user moze zaznaczac kolejne pozycje)

## Referencje
- DESIGN_SYSTEM.md sekcja 9
EOF
)"
echo -e "  ${GREEN}#20${NC} Animacje checkbox + znikanie"

gh issue create \
  --title "Animacja przypisywania kategorii + dodawania nowych pozycji" \
  --milestone "$M5" \
  --label "ux,ui,priority:medium" \
  --body "$(cat <<'EOF'
## Opis
Animacje dla dodawania produktow i przypisywania kategorii.

## Animacje

### Nowy produkt dodany na liste
- SlideDown + fadeIn: 300ms ease-out
- Pozycja "wyrasta" z gory sekcji kategorii

### Przypisanie kategorii (z "Do sklasyfikowania" do kategorii)
- SlideOut z sekcji "Do sklasyfikowania": 200ms
- SlideIn do nowej sekcji kategorii: 200ms
- Laczny efekt: 400ms ease-in-out

### Dropdown kategorii
- ScaleY 0->1 + fadeIn: 200ms ease-out
- Zamkniecie: scaleY 1->0 + fadeOut: 150ms

### Chip toggle
- Background-color transition: 150ms ease

## Zadania
- [ ] Animacja dodawania nowej pozycji (slideDown + fadeIn)
- [ ] Animacja przenoszenia miedzy sekcjami (assign kategorii)
- [ ] Animacja dropdown (scaleY)
- [ ] Animacja chipsow (bg color transition)
- [ ] framer-motion `layout` prop dla automatycznego reflow
- [ ] AnimatePresence dla dynamicznych list
- [ ] Testowanie na mobile (plynnosc)
- [ ] Respektuj `prefers-reduced-motion`

## Acceptance Criteria
- Nowe pozycje pojawiaja sie z animacja
- Przypisanie kategorii wyglada jak "przeniesienie"
- Dropdown animuje sie plynnie
- Chipsy plynnie zmieniaja stan
- 60fps na mobile

## Referencje
- DESIGN_SYSTEM.md sekcja 9
EOF
)"
echo -e "  ${GREEN}#21${NC} Animacja kategoryzacji + dodawania"

gh issue create \
  --title "PWA — manifest, service worker, ikona na ekranie" \
  --milestone "$M5" \
  --label "pwa,setup,priority:medium" \
  --body "$(cat <<'EOF'
## Opis
Konfiguracja Progressive Web App — aplikacja moze byc zainstalowana na ekranie glownym telefonu.

## Zadania
- [ ] Setup `next-pwa` lub `@serwist/next`
- [ ] Web app manifest (`manifest.json`):
  ```json
  {
    "name": "Cartlo",
    "short_name": "Cartlo",
    "description": "Cartlo — rodzinna lista zakupow",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#FAFAF8",
    "theme_color": "#4ADE80",
    "icons": [...]
  }
  ```
- [ ] Ikony:
  - 192x192 (Android)
  - 512x512 (Android splash)
  - apple-touch-icon 180x180 (iOS)
  - Styl: minimalistyczna, mint-themed
- [ ] Service worker:
  - Cache-first: statyczne assety (JS, CSS, fonty, ikony)
  - Network-first: API calls (Supabase)
  - Offline fallback page
- [ ] iOS meta tagi:
  - `apple-mobile-web-app-capable`: yes
  - `apple-mobile-web-app-status-bar-style`: default
  - `apple-mobile-web-app-title`: Cartlo
- [ ] Splash screen (iOS)
- [ ] Theme color w `<meta>` tag

## Acceptance Criteria
- "Dodaj do ekranu glownego" dziala na iOS Safari
- "Zainstaluj aplikacje" dziala na Chrome Android
- Aplikacja otwiera sie w trybie standalone (bez paska przegladarki)
- Ikona wyswietla sie poprawnie
- Podstawowe offline support (cached strony)
- Lighthouse PWA score >= 90

## Referencje
- DESIGN_SYSTEM.md sekcja 2.3 (kolory), 7.8 (safe area)
EOF
)"
echo -e "  ${GREEN}#22${NC} PWA — manifest, service worker, ikona"

echo ""

# =============================================================================
# PODSUMOWANIE
# =============================================================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Gotowe!                                   ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Utworzono:"
echo -e "  ${GREEN}5${NC} milestones"
echo -e "  ${GREEN}11${NC} labels"
echo -e "  ${GREEN}22${NC} issues"
echo ""
echo -e "Milestones:"
echo -e "  M1: Project Setup        (issues #1-#4)"
echo -e "  M2: Auth & Family        (issues #5-#9)"
echo -e "  M3: Shopping List Core   (issues #10-#15)"
echo -e "  M4: Smart Features       (issues #16-#19)"
echo -e "  M5: Polish & PWA         (issues #20-#22)"
echo ""
echo -e "Nastepny krok: zacznij od issue #1 (Inicjalizacja projektu)"
