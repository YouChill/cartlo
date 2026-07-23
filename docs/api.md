# Cartlo Agent API (v1)

REST API pozwalające zewnętrznemu agentowi (np. asystentowi AI) czytać i
edytować listę zakupów rodziny. Uwierzytelnianie odbywa się kluczem API
generowanym per rodzina — klucz sam wyznacza rodzinę, na której działa.

## Uwierzytelnianie

1. W aplikacji wejdź w **Ustawienia → Klucz API (Agent AI)** i wygeneruj klucz
   (`cartlo_sk_...`). Klucz jest pokazywany tylko raz.
2. Każde żądanie wysyłaj z nagłówkiem:

   ```
   Authorization: Bearer cartlo_sk_...
   ```

Wygenerowanie nowego klucza unieważnia poprzedni. Klucz można też unieważnić
bez tworzenia nowego. Pozycje dodane przez API są podpisane profilem „Agent".

Przykładowy plik `.env` agenta:

```env
CARTLO_API_URL=https://cartlo.vercel.app
CARTLO_API_KEY=cartlo_sk_twoj-klucz
```

## Endpointy

Wszystkie odpowiedzi to JSON. Błędy mają format `{ "error": "..." }` z
odpowiednim kodem HTTP (`401` brak/zły klucz, `400` złe dane, `404` brak
pozycji, `409` duplikat).

| Metoda | Ścieżka | Opis |
|---|---|---|
| `GET` | `/api/v1/list` | Aktualna lista zakupów + dostępne kategorie |
| `POST` | `/api/v1/items` | Dodanie pojedynczej pozycji |
| `PATCH` | `/api/v1/items/{id}` | Edycja pozycji (nazwa, ilość, jednostka, kategoria, odhaczenie) |
| `DELETE` | `/api/v1/items/{id}` | Usunięcie pozycji |
| `POST` | `/api/v1/items/bulk` | Dodanie całej listy naraz (max 100 pozycji) |

### Pola pozycji (żądania)

| Pole | Typ | Opis |
|---|---|---|
| `product_name` | string | Wymagane przy dodawaniu, 1–100 znaków |
| `quantity` | number | Opcjonalne, > 0 i ≤ 9999.99 (domyślnie 1) |
| `unit` | string | Opcjonalne, jedno z: `szt`, `g`, `kg`, `ml`, `l` (domyślnie `szt`) |
| `category` | string | Opcjonalne, nazwa kategorii (wielkość liter i polskie znaki bez znaczenia, np. `nabial` = `Nabiał`). Nieznana nazwa → pozycja bez kategorii. Brak pola przy `POST /items` → automatyczna kategoryzacja |
| `is_checked` | boolean | Tylko `PATCH` — odhacza/przywraca pozycję |

### Przykłady (curl)

```bash
BASE=https://cartlo.vercel.app
KEY=cartlo_sk_twoj-klucz

# Aktualna lista
curl -s "$BASE/api/v1/list" -H "Authorization: Bearer $KEY"

# Dodanie pozycji
curl -s -X POST "$BASE/api/v1/items" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"product_name":"Mleko","quantity":2,"unit":"l","category":"Nabiał"}'

# Edycja pozycji (odhaczenie)
curl -s -X PATCH "$BASE/api/v1/items/ID_POZYCJI" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"is_checked":true}'

# Zmiana ilości
curl -s -X PATCH "$BASE/api/v1/items/ID_POZYCJI" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"quantity":3,"unit":"szt"}'

# Usunięcie pozycji
curl -s -X DELETE "$BASE/api/v1/items/ID_POZYCJI" \
  -H "Authorization: Bearer $KEY"

# Dodanie całej listy naraz
curl -s -X POST "$BASE/api/v1/items/bulk" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"items":[
    {"product_name":"Chleb","category":"Pieczywo"},
    {"product_name":"Masło","quantity":1,"unit":"szt","category":"Nabiał"},
    {"product_name":"Pomidory","quantity":500,"unit":"g","category":"Warzywa i owoce"}
  ]}'
```

### Odpowiedzi

`GET /api/v1/list`:

```json
{
  "family_id": "…",
  "items": [
    {
      "id": "…",
      "product_name": "Mleko",
      "category_id": "…",
      "category_name": "Nabiał",
      "category_icon": "Milk",
      "quantity": 2,
      "unit": "l",
      "is_checked": false,
      "added_by_name": "Agent",
      "checked_by_name": null,
      "created_at": "2026-07-23T10:00:00.000Z",
      "checked_at": null
    }
  ],
  "categories": [{ "id": "…", "name": "Nabiał", "icon": "Milk" }]
}
```

`POST /items` i `PATCH /items/{id}` zwracają `{ "item": { … } }` (ten sam
kształt co wyżej). `POST /items` zwraca `409` z `item_id`, gdy nieodhaczona
pozycja o tej nazwie już istnieje. `DELETE` zwraca `{ "deleted": true }`.

`POST /items/bulk` pomija duplikaty (względem aktywnej listy i wewnątrz
żądania) zamiast zgłaszać błąd:

```json
{ "added": 2, "skipped": ["Chleb"], "items": [ … ] }
```

## Uwagi

- Zmiany wykonane przez API są natychmiast widoczne w aplikacji (Pusher).
- Automatyczna kategoryzacja przy `POST /items` używa bazy produktów rodziny
  (i opcjonalnie embeddingów OpenAI). Przy `POST /items/bulk` embeddingi są
  pomijane dla szybkości — podawaj `category` jawnie, jeśli zależy Ci na
  kategoriach.
