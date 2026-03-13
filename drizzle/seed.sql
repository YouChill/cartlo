-- =============================================================================
-- Cartlo — Seed Data (idempotent — safe to re-run)
-- 16 default categories + ~160 global products
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Categories (global, is_default = true, family_id = NULL)
-- -----------------------------------------------------------------------------

INSERT INTO public.categories (id, name, icon, sort_order, is_default, family_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Owoce i warzywa',      'Apple',       1,  true, NULL),
  ('a0000000-0000-0000-0000-000000000002', 'Nabial',               'Milk',        2,  true, NULL),
  ('a0000000-0000-0000-0000-000000000003', 'Pieczywo',             'Croissant',   3,  true, NULL),
  ('a0000000-0000-0000-0000-000000000004', 'Mieso i wedliny',     'Beef',        4,  true, NULL),
  ('a0000000-0000-0000-0000-000000000005', 'Ryby i owoce morza',  'Fish',        5,  true, NULL),
  ('a0000000-0000-0000-0000-000000000006', 'Mrozonki',             'Snowflake',   6,  true, NULL),
  ('a0000000-0000-0000-0000-000000000007', 'Napoje',               'CupSoda',     7,  true, NULL),
  ('a0000000-0000-0000-0000-000000000008', 'Slodycze i przekaski', 'Cookie',      8,  true, NULL),
  ('a0000000-0000-0000-0000-000000000009', 'Przyprawy i sosy',    'FlaskRound',  9,  true, NULL),
  ('a0000000-0000-0000-0000-000000000014', 'Oleje',                'Droplets',    10, true, NULL),
  ('a0000000-0000-0000-0000-000000000015', 'Maki i sypkie skladniki', 'Wheat',   11, true, NULL),
  ('a0000000-0000-0000-0000-000000000016', 'Kasze i makarony',    'Bean',        12, true, NULL),
  ('a0000000-0000-0000-0000-000000000010', 'Chemia domowa',        'SprayConical', 13, true, NULL),
  ('a0000000-0000-0000-0000-000000000011', 'Higiena',              'ShowerHead',  14, true, NULL),
  ('a0000000-0000-0000-0000-000000000012', 'Artykuly domowe',      'Home',        15, true, NULL),
  ('a0000000-0000-0000-0000-000000000013', 'Inne',                 'Package',     16, true, NULL)
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
  ('Jablka',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Banany',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Pomidory',         'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Ogorki',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Ziemniaki',        'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Marchewka',        'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Cebula',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Czosnek',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Papryka',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Salata',           'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Cytryny',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Pomarancze',       'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Winogrona',        'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Pieczarki',        'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Awokado',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Brokuły',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Szpinak',          'a0000000-0000-0000-0000-000000000001', NULL, 0),
  ('Kapusta',          'a0000000-0000-0000-0000-000000000001', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Nabial
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Mleko 2%',         'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Mleko 3.2%',       'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Maslo',            'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Jajka',            'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Jogurt naturalny', 'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Ser zolty',        'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Ser bialy',        'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Twarog',           'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Smietana 18%',     'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Smietana 30%',     'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Kefir',            'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Mozzarella',       'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Parmezan',         'a0000000-0000-0000-0000-000000000002', NULL, 0),
  ('Mleko migdalowe',  'a0000000-0000-0000-0000-000000000002', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Pieczywo
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Chleb',            'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Bulki',            'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Chleb tostowy',    'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Bagietka',         'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Tortilla',         'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Bialko',           'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Chleb razowy',     'a0000000-0000-0000-0000-000000000003', NULL, 0),
  ('Pita',             'a0000000-0000-0000-0000-000000000003', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Mieso i wedliny
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Piersi z kurczaka','a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Mieso mielone',    'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Szynka',           'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Boczek',           'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Kielbasa',         'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Poledwica',        'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Salami',           'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Udka z kurczaka',  'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Schab',            'a0000000-0000-0000-0000-000000000004', NULL, 0),
  ('Kabanosy',         'a0000000-0000-0000-0000-000000000004', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Ryby i owoce morza
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Losos',            'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Tuńczyk (puszka)', 'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Krewetki',         'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Dorsz',            'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Sledz',            'a0000000-0000-0000-0000-000000000005', NULL, 0),
  ('Makrela',          'a0000000-0000-0000-0000-000000000005', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Mrozonki
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
  ('Sok pomaranczowy', 'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Sok jablkowy',     'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Kawa mielona',     'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Kawa rozpuszczalna','a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Herbata',          'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Cola',             'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Piwo',             'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Wino',             'a0000000-0000-0000-0000-000000000007', NULL, 0),
  ('Woda gazowana',    'a0000000-0000-0000-0000-000000000007', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Slodycze i przekaski
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
  ('Chałwa',           'a0000000-0000-0000-0000-000000000008', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Przyprawy i sosy
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Sol',              'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Pieprz',           'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Ketchup',          'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Musztarda',        'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Majonez',          'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Ocet',             'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Sos sojowy',       'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Papryka mielona',  'a0000000-0000-0000-0000-000000000009', NULL, 0),
  ('Passata pomidorowa','a0000000-0000-0000-0000-000000000009', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Oleje
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Oliwa z oliwek',   'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej rzepakowy',   'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej kokosowy',    'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej slonecznikowy','a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej sezamowy',    'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej lniany',      'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Maslo klarowane',  'a0000000-0000-0000-0000-000000000014', NULL, 0),
  ('Olej z pestek winogron', 'a0000000-0000-0000-0000-000000000014', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Maki i sypkie skladniki
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Maka pszenna',     'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Maka razowa',      'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Maka ziemniaczana','a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Maka kukurydziana','a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Skrobia kukurydziana','a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Cukier',           'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Cukier puder',     'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Cukier trzcinowy', 'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Proszek do pieczenia','a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Soda oczyszczona', 'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Drozdze',          'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Platki owsiane',   'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Bulka tarta',      'a0000000-0000-0000-0000-000000000015', NULL, 0),
  ('Kakao',            'a0000000-0000-0000-0000-000000000015', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Kasze i makarony
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Ryz bialy',        'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Ryz basmati',      'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Ryz jasminowy',    'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Ryz brazowy',      'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kasza gryczana',   'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kasza jaglana',    'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kasza jeczmienna', 'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kasza manna',      'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Kuskus',           'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron spaghetti','a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron penne',    'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron swiderki', 'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron ryzowy',   'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron lasagne',  'a0000000-0000-0000-0000-000000000016', NULL, 0),
  ('Makaron nitki',    'a0000000-0000-0000-0000-000000000016', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Chemia domowa
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Plyn do naczyn',   'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Proszek do prania','a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Plyn do podlog',   'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Gabki do naczyn',  'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Worki na smieci',  'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Odswiezacz powietrza','a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Plyn do WC',       'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Tabletki do zmywarki','a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Plyn do szyb',     'a0000000-0000-0000-0000-000000000010', NULL, 0),
  ('Wybielacz',        'a0000000-0000-0000-0000-000000000010', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Higiena
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Papier toaletowy', 'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Mydlo',            'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Szampon',          'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Pasta do zebow',   'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Dezodorant',       'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Reczniki papierowe','a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Chusteczki',       'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Szczoteczka do zebow','a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Zel pod prysznic', 'a0000000-0000-0000-0000-000000000011', NULL, 0),
  ('Krem do rak',      'a0000000-0000-0000-0000-000000000011', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- Artykuly domowe
INSERT INTO public.products (name, category_id, family_id, usage_count) VALUES
  ('Zarowki',          'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Baterie',          'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Zapalki',          'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Folia aluminiowa', 'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Folia spozywcza',  'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Papier do pieczenia','a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Swiece',           'a0000000-0000-0000-0000-000000000012', NULL, 0),
  ('Torebki sniadaniowe','a0000000-0000-0000-0000-000000000012', NULL, 0)
ON CONFLICT (name, family_id) DO UPDATE SET category_id = EXCLUDED.category_id;

-- =============================================================================
-- Done. Run POST /api/embeddings/seed to generate embeddings for new products.
-- =============================================================================
