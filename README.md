# Cartlo

Rodzinna lista zakupow jako PWA — wspoldzielona w czasie rzeczywistym, z inteligentna kategoryzacja produktow.

## Funkcje

- **Wspolna lista zakupow** — wspoldzielona miedzy czlonkami rodziny z synchronizacja w czasie rzeczywistym (Pusher)
- **Inteligentna kategoryzacja** — nowe produkty sa automatycznie klasyfikowane na podstawie podobienstwa semantycznego (pgvector + OpenAI Embeddings)
- **Autouzupelnianie** — wyszukiwanie produktow z podpowiedziami, sortowane wg popularnosci, uzupelniane wyszukiwaniem semantycznym
- **Szablony list** — zapisywanie i ponowne uzycie list zakupow z drag & drop, ilosciami i jednostkami
- **Zarzadzanie rodzina** — kody zaproszen, zaproszenia email
- **Resetowanie hasla** — link „Nie pamietasz hasla?” na ekranie logowania wysyla jednorazowy link (wazny 1h) na email; po ustawieniu nowego hasla uzytkownik jest od razu zalogowany, a na jego adres trafia powiadomienie o zmianie hasla
- **PWA** — instalowalna aplikacja z Service Workerem
- **Tryb ciemny** — automatyczny i reczny

## Stack technologiczny

| Warstwa      | Technologia                          |
| ------------ | ------------------------------------ |
| Framework    | Next.js 16 (App Router)              |
| Jezyk        | TypeScript                           |
| Baza danych  | PostgreSQL (Neon) + pgvector         |
| ORM          | Drizzle ORM                          |
| Autentykacja | NextAuth.js v5                       |
| Realtime     | Pusher                               |
| UI           | shadcn/ui, Radix UI, Tailwind CSS v4 |
| Embeddingi   | OpenAI text-embedding-3-small        |
| Deploy       | Vercel                               |

## Uruchomienie lokalne

```bash
# Instalacja zaleznosci
npm install

# Konfiguracja zmiennych srodowiskowych
cp .env.local.example .env.local
# Uzupelnij wartosci w .env.local

# Migracja bazy danych
npm run db:push

# Uruchomienie pgvector (jednorazowo na bazie Neon)
# Wykonaj zawartosc drizzle/migration_embeddings.sql

# Seed danych (kategorie + produkty)
# Wykonaj zawartosc drizzle/seed.sql

# Uruchomienie serwera deweloperskiego
npm run dev
```

Aplikacja dostepna pod [http://localhost:3000](http://localhost:3000).

## Zmienne srodowiskowe

| Zmienna                                                         | Opis                                  | Wymagana |
| --------------------------------------------------------------- | ------------------------------------- | -------- |
| `DATABASE_URL`                                                  | Connection string do Neon PostgreSQL  | Tak      |
| `AUTH_SECRET`                                                   | Secret dla NextAuth.js                | Tak      |
| `PUSHER_APP_ID`                                                 | Pusher App ID                         | Tak      |
| `NEXT_PUBLIC_PUSHER_KEY`                                        | Pusher Key (publiczny)                | Tak      |
| `PUSHER_SECRET`                                                 | Pusher Secret                         | Tak      |
| `NEXT_PUBLIC_PUSHER_CLUSTER`                                    | Pusher Cluster (np. `eu`)             | Tak      |
| `OPENAI_API_KEY`                                                | Klucz API OpenAI dla embeddingów      | Nie\*    |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP dla zaproszen i resetu hasla     | Nie      |
| `NEXT_PUBLIC_APP_URL`                                           | URL aplikacji (linki w emailach)      | Nie      |
| `CRON_SECRET`                                                   | Autoryzacja Vercel Cron (`/api/cron`) | Nie      |

\* Bez `OPENAI_API_KEY` aplikacja dziala normalnie, ale bez inteligentnej kategoryzacji i wyszukiwania semantycznego.

Bez konfiguracji SMTP zaproszenia trzeba wysylac linkiem recznie, a resetowanie hasla jest niedostepne. Reset hasla wymaga migracji `drizzle/migration_password_reset.sql` (lub `npm run db:push`).

Zuzyte i przeterminowane tokeny resetu sa usuwane raz dziennie przez Vercel Cron (`vercel.json` → `/api/cron/cleanup-password-reset-tokens`). Endpoint wymaga naglowka `Authorization: Bearer <CRON_SECRET>`; bez ustawionego `CRON_SECRET` odpowiada 503. Recznie: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/cleanup-password-reset-tokens`.

## API dla agenta (/api/v1)

Aplikacja wystawia REST API pozwalajace zewnetrznemu agentowi (np. asystentowi AI) czytac i edytowac liste zakupow rodziny. Klucz API generuje sie per rodzina w **Ustawienia → Klucz API (Agent AI)**; pozycje dodane przez API sa podpisane profilem „Agent". Szczegoly i przyklady: [docs/api.md](docs/api.md). Wymagana migracja: `drizzle/migration_api_keys.sql` (lub `npm run db:push`).

## Inteligentna kategoryzacja produktow

System wykorzystuje embeddingi wektorowe (OpenAI + pgvector) do automatycznej klasyfikacji produktow:

1. **Dodawanie produktu** — jezeli produkt nie istnieje w bazie, system generuje embedding nazwy i szuka semantycznie podobnych produktow. Jesli znajdzie (cosine similarity > 0.8), przypisuje kategorie najblizszego sasiada.
2. **Reczna klasyfikacja** — gdy uzytkownik recznie przypisze kategorie, system zapisuje embedding produktu. Przyszle podobne produkty beda auto-kategoryzowane.
3. **Wyszukiwanie** — gdy standardowe wyszukiwanie (ILIKE) zwraca malo wynikow, system uzupelnia je wyszukiwaniem semantycznym.

### Seedowanie embeddingów

Po pierwszym deployu, wygeneruj embeddingi dla istniejacych produktow:

```bash
curl -X POST https://your-app.vercel.app/api/embeddings/seed \
  -H "Authorization: Bearer YOUR_AUTH_SECRET"
```

## Skrypty

| Skrypt                | Opis                         |
| --------------------- | ---------------------------- |
| `npm run dev`         | Serwer deweloperski          |
| `npm run build`       | Build produkcyjny            |
| `npm run start`       | Serwer produkcyjny           |
| `npm run lint`        | ESLint                       |
| `npm run format`      | Prettier                     |
| `npm run db:push`     | Push schematu do bazy        |
| `npm run db:generate` | Generowanie migracji         |
| `npm run db:migrate`  | Uruchomienie migracji        |
| `npm run db:studio`   | Drizzle Studio (GUI do bazy) |
