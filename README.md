# Cartlo

Rodzinna aplikacja do wspólnych list zakupów. Umożliwia tworzenie rodziny, zapraszanie członków i wspólne zarządzanie listą zakupów w czasie rzeczywistym.

## Funkcjonalności

- **Lista zakupów** — dodawanie, zaznaczanie i usuwanie produktów z kategoryzacją
- **Rodzina** — tworzenie rodziny, zapraszanie członków przez link lub Web Share API
- **Ustawienia** — edycja nazwy użytkownika, zmiana hasła, wybór motywu (jasny/ciemny/systemowy)
- **Onboarding** — tworzenie nowej rodziny lub dołączanie do istniejącej przez kod zaproszenia
- **PWA** — obsługa jako aplikacja na telefonie (manifest, service worker)

## Tech stack

- **Next.js 16** (App Router, Server Actions)
- **React 19**
- **Supabase** (PostgreSQL, Auth, Realtime, Row-Level Security)
- **Tailwind CSS 4**
- **shadcn/ui** + Radix UI
- **TypeScript 5**

## Uruchomienie lokalne

### Wymagania

- Node.js 18+
- Konto Supabase (lub lokalny Supabase CLI)

### Instalacja

```bash
npm install
```

### Zmienne środowiskowe

Utwórz plik `.env.local` na podstawie poniższego szablonu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<twoj-projekt>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Migracje bazy danych

```bash
supabase db push
# lub ręcznie wykonaj pliki z supabase/migrations/
```

### Uruchomienie serwera deweloperskiego

```bash
npm run dev
```

Aplikacja dostępna pod adresem [http://localhost:3000](http://localhost:3000).

## Struktura projektu

```
app/
├── (auth)/         # Strony publiczne: logowanie, onboarding, dołączanie
│   ├── login/
│   ├── onboarding/
│   └── join/[code]/
└── (app)/          # Strony chronione (wymagają zalogowania + rodziny)
    ├── page.tsx    # Lista zakupów
    ├── family/     # Zarządzanie rodziną i zaproszeniami
    └── settings/   # Ustawienia profilu i konta
components/         # Współdzielone komponenty UI
lib/supabase/       # Klient Supabase (server, client, middleware)
supabase/
├── migrations/     # Migracje bazy danych
└── seed.sql        # Dane początkowe (kategorie, produkty)
types/              # Typy TypeScript dla tabel Supabase
```

## Baza danych

| Tabela | Opis |
|---|---|
| `families` | Rodziny z unikalnym kodem zaproszenia |
| `profiles` | Profile użytkowników powiązane z rodziną |
| `categories` | Kategorie produktów (globalne lub per-rodzina) |
| `products` | Produkty z licznikiem użycia |
| `shopping_items` | Pozycje na liście zakupów z realtime |

Wszystkie tabele chronione przez Row-Level Security — użytkownik widzi tylko dane swojej rodziny.
