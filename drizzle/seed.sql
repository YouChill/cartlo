-- =============================================================================
-- Cartlo — Seed Data (idempotent — safe to re-run)
-- 17 default categories + ~170 global products
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Categories (global, is_default = true, family_id = NULL)
-- -----------------------------------------------------------------------------

INSERT INTO public.categories (id, name, icon, sort_order, is_default, family_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Owoce i warzywa',      'Apple',       1,  true, NULL),
  ('a0000000-0000-0000-0000-000000000002', 'Nabiał',               'Milk',        2,  true, NULL),
  ('a0000000-0000-0000-0000-000000000003', 'Pieczywo',             'Croissant',   3,  true, NULL),
  ('a0000000-0000-0000-0000-000000000004', 'Mięso i wędliny',     'Beef',        4,  true, NULL),
  ('a0000000-0000-0000-0000-000000000005', 'Ryby i owoce morza',  'Fish',        5,  true, NULL),
  ('a0000000-0000-0000-0000-000000000006', 'Mrożonki',             'Snowflake',   6,  true, NULL),
  ('a0000000-0000-0000-0000-000000000007', 'Napoje',               'CupSoda',     7,  true, NULL),
  ('a0000000-0000-0000-0000-000000000008', 'Słodycze i przekąski', 'Cookie',      8,  true, NULL),
  ('a0000000-0000-0000-0000-000000000009', 'Przyprawy i sosy',    'FlaskRound',  9,  true, NULL),
  ('a0000000-0000-0000-0000-000000000014', 'Oleje',                'Droplets',    10, true, NULL),
  ('a0000000-0000-0000-0000-000000000015', 'Mąki i sypkie składniki', 'Wheat',   11, true, NULL),
  ('a0000000-0000-0000-0000-000000000016', 'Kasze i makarony',    'Bean',        12, true, NULL),
  ('a0000000-0000-0000-0000-000000000017', 'Przetwory',            'Amphora',     13, true, NULL),
  ('a0000000-0000-0000-0000-000000000010', 'Chemia domowa',        'SprayConical', 14, true, NULL),
  ('a0000000-0000-0000-0000-000000000011', 'Higiena',              'ShowerHead',  15, true, NULL),
  ('a0000000-0000-0000-0000-000000000012', 'Artykuły domowe',      'Home',        16, true, NULL),
  ('a0000000-0000-0000-0000-000000000013', 'Inne',                 'Package',     17, true, NULL)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  icon       = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- Products (global, family_id = NULL)
-- ON CONFLICT on unique(name, family_id) — updates category if product exists
-- -----------------------------------------------------------------------------

-- Owoce i warzywa
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Jabłka',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Banany',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Pomidory',         'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Ogórki',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Ziemniaki',        'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Marchewka',        'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Cebula',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Czosnek',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Papryka',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Sałata',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Cytryny',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Pomarańcze',       'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Winogrona',        'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Pieczarki',        'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Awokado',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Brokuły',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Szpinak',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Kapusta',          'a0000000-0000-0000-0000-000000000001', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Nabiał
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Mleko 2%',         'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Mleko 3.2%',       'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Masło',            'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Jajka',            'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Jogurt naturalny', 'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Ser żółty',        'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Ser biały',        'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Twaróg',           'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Śmietana 18%',     'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Śmietana 30%',     'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Kefir',            'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Mozzarella',       'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Parmezan',         'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Mleko migdałowe',  'a0000000-0000-0000-0000-000000000002', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Pieczywo
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Chleb',            'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Bułki',            'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Chleb tostowy',    'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Bagietka',         'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Tortilla',         'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Białko',           'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Chleb razowy',     'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Pita',             'a0000000-0000-0000-0000-000000000003', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Mięso i wędliny
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Piersi z kurczaka','a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Mięso mielone',    'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Szynka',           'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Boczek',           'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Kiełbasa',         'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Polędwica',        'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Salami',           'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Udka z kurczaka',  'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Schab',            'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Kabanosy',         'a0000000-0000-0000-0000-000000000004', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Ryby i owoce morza
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Łosoś',            'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Tuńczyk (puszka)', 'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Krewetki',         'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Dorsz',            'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Śledź',            'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Makrela',          'a0000000-0000-0000-0000-000000000005', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Mrożonki
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Mrożone warzywa',  'a0000000-0000-0000-0000-000000000006', NULL, 0),
  ('Mrożone owoce',    'a0000000-0000-0000-0000-000000000006', NULL, 0),
  ('Pierogi mrożone',  'a0000000-0000-0000-0000-000000000006', NULL, 0),
  ('Frytki mrożone',   'a0000000-0000-0000-0000-000000000006', NULL, 0),
  ('Pizza mrożona',    'a0000000-0000-0000-0000-000000000006', NULL, 0),
  ('Lody',             'a0000000-0000-0000-0000-000000000006', NULL, 0),
  ('Ryba mrożona',     'a0000000-0000-0000-0000-000000000006', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Napoje
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Woda mineralna',   'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Sok pomarańczowy', 'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Sok jabłkowy',     'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Kawa mielona',     'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Kawa rozpuszczalna',  'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Herbata',          'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Cola',             'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Piwo',             'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Wino',             'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Woda gazowana',    'a0000000-0000-0000-0000-000000000007', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Słodycze i przekąski
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Czekolada',        'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Ciastka',          'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Chipsy',           'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Orzechy',          'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Batony',           'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Żelki',            'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Krakersy',         'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Paluszki',         'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Popcorn',          'a0000000-0000-0000-0000-000000000008', NULL, 0),
  ('Chałwa',            'a0000000-0000-0000-0000-000000000008', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Przyprawy i sosy
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Sól',              'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Pieprz',           'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Ketchup',          'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Musztarda',        'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Majonez',          'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Ocet',             'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Sos sojowy',       'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Papryka mielona',  'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Passata pomidorowa',  'a0000000-0000-0000-0000-000000000009', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Oleje
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Oliwa z oliwek',   'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej rzepakowy',   'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej kokosowy',    'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej słonecznikowy',  'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej sezamowy',    'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej lniany',      'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Masło klarowane',  'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej z pestek winogron', 'a0000000-0000-0000-0000-000000000014', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Mąki i sypkie składniki
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Mąka pszenna',     'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Mąka razowa',      'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Mąka ziemniaczana',  'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Mąka kukurydziana',  'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Skrobia kukurydziana',  'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Cukier',           'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Cukier puder',     'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Cukier trzcinowy', 'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Proszek do pieczenia',  'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Soda oczyszczona', 'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Drożdże',          'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Płatki owsiane',   'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Bułka tarta',      'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Kakao',            'a0000000-0000-0000-0000-000000000015', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Kasze i makarony
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Ryż biały',        'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Ryż basmati',      'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Ryż jaśminowy',    'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Ryż brązowy',      'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kasza gryczana',   'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kasza jaglana',    'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kasza jęczmienna', 'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kasza manna',      'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kuskus',           'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron spaghetti','a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron penne',    'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron świderki', 'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron ryżowy',   'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron lasagne',  'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron nitki',    'a0000000-0000-0000-0000-000000000016', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Przetwory
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Ogórki konserwowe',  'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Kukurydza w puszce', 'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Groszek w puszce',   'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Fasola w puszce',    'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Pomidory w puszce',  'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Koncentrat pomidorowy', 'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Dżem',               'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Miód',               'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Oliwki',             'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Kapary',             'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Marynowane papryki', 'a0000000-0000-0000-0000-000000000017', NULL, 0),
  ('Kompot',             'a0000000-0000-0000-0000-000000000017', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Chemia domowa
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Płyn do naczyń',   'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Proszek do prania',  'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Płyn do podłóg',   'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Gąbki do naczyń',  'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Worki na śmieci',  'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Odświeżacz powietrza',  'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Płyn do WC',       'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Tabletki do zmywarki',  'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Płyn do szyb',     'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Wybielacz',        'a0000000-0000-0000-0000-000000000010', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Higiena
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Papier toaletowy', 'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Mydło',            'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Szampon',          'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Pasta do zębów',   'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Dezodorant',       'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Ręczniki papierowe',  'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Chusteczki',       'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Szczoteczka do zębów',  'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Żel pod prysznic', 'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Krem do rąk',      'a0000000-0000-0000-0000-000000000011', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Artykuły domowe
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Żarówki',          'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Baterie',          'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Zapałki',          'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Folia aluminiowa', 'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Folia spożywcza',  'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Papier do pieczenia',  'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Świece',           'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Torebki śniadaniowe',  'a0000000-0000-0000-0000-000000000012', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- -----------------------------------------------------------------------------
-- Sync family products: update category_id for family-specific products
-- whose names match global (seed) products, so they pick up new categories.
-- Also update category_id on shopping_items that reference those products.
-- -----------------------------------------------------------------------------

UPDATE public.products AS fp
SET category_id = gp.category_id
FROM public.products AS gp
WHERE gp.family_id IS NULL
  AND fp.family_id IS NOT NULL
  AND lower(fp.name) = lower(gp.name)
  AND (fp.category_id IS DISTINCT FROM gp.category_id);

UPDATE public.shopping_items AS si
SET category_id = p.category_id
FROM public.products AS p
WHERE si.product_name = p.name
  AND p.family_id IS NULL
  AND (si.category_id IS DISTINCT FROM p.category_id);

-- =============================================================================
-- Done. Run POST /api/embeddings/seed to generate embeddings for new products.
-- =============================================================================
