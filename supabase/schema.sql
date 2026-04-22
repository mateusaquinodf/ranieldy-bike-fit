-- ============================================================
-- BikeFit — Schema Supabase v1.1
-- Todas as tabelas usam o prefixo bfr_ (BFR-)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- Habilita a extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

-- Conteúdo editável da LP (textos, headlines)
CREATE TABLE IF NOT EXISTS bfr_content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Depoimentos
CREATE TABLE IF NOT EXISTS bfr_testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  modality    TEXT NOT NULL,
  text        TEXT NOT NULL,
  rating      INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  photo_url   TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  "order"     INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ
CREATE TABLE IF NOT EXISTS bfr_faq (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  "order"     INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Configurações gerais (contato, redes sociais)
CREATE TABLE IF NOT EXISTS bfr_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  value       TEXT NOT NULL DEFAULT ''
);

-- Slots de disponibilidade
CREATE TABLE IF NOT EXISTS bfr_availability_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  time         TIME NOT NULL,
  max_bookings INT NOT NULL DEFAULT 1,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (date, time)
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS bfr_bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL,
  modality    TEXT NOT NULL,
  date        DATE NOT NULL,
  time        TIME NOT NULL,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

INSERT INTO bfr_content (key, value) VALUES
  ('hero_headline',    'Seu corpo merece estar na posição certa.'),
  ('hero_subheadline', 'BikeFit profissional e presencial para ciclistas que querem pedalar mais, com menos dor e mais performance.'),
  ('hero_badge',       '✓ Atendimento Presencial · São Paulo, SP'),
  ('whatsapp_number',  '5511999999999'),
  ('whatsapp_message', 'Olá! Gostaria de saber mais sobre o BikeFit.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO bfr_settings (key, value) VALUES
  ('whatsapp',   '5511999999999'),
  ('instagram',  'https://instagram.com/'),
  ('strava',     'https://strava.com/'),
  ('youtube',    'https://youtube.com/'),
  ('email',      'contato@exemplo.com.br'),
  ('address',    'São Paulo, SP'),
  ('city',       'São Paulo')
ON CONFLICT (key) DO NOTHING;

INSERT INTO bfr_testimonials (name, modality, text, rating, photo_url, active, "order") VALUES
  ('Carlos M.',    'Ciclismo de Estrada', 'Após o BikeFit resolvi a dor no joelho que me perseguia há meses. Minha posição ficou muito mais eficiente e agora pedalo com prazer novamente.',                      5, 'https://i.pravatar.cc/150?img=11', TRUE, 1),
  ('Ana Paula R.', 'Triathlon',           'Profissional incrível! Ajustou minha posição para as três modalidades e meu tempo no ciclismo melhorou significativamente na próxima prova.',                           5, 'https://i.pravatar.cc/150?img=47', TRUE, 2),
  ('Diego S.',     'MTB',                 'Valia cada centavo. Saí da sessão com a bike completamente regulada e um relatório detalhado de todas as medidas. Super recomendo!',                                     5, 'https://i.pravatar.cc/150?img=32', TRUE, 3),
  ('Fernanda L.',  'Ciclismo Urbano',     'Comecei a usar a bike para trabalhar e estava com dores nas costas toda semana. Depois do BikeFit, zero desconforto. Simplesmente incrível.',                           5, 'https://i.pravatar.cc/150?img=44', TRUE, 4),
  ('Rodrigo T.',   'Ciclismo de Estrada', 'Ganhei mais de 15W no FTP só com o ajuste de posição. O Ranieldy é extremamente técnico e atencioso. Voltarei para revisão anual com certeza.',                        5, 'https://i.pravatar.cc/150?img=68', TRUE, 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SLOTS DE DISPONIBILIDADE — Abril / Maio 2026
-- ============================================================
-- Segunda-feira: 09:00 e 14:00
-- Terça-feira:   09:00 e 16:30
-- Quarta-feira:  09:00, 11:00 e 14:00
-- Quinta-feira:  14:00 e 16:30
-- Sexta-feira:   09:00 e 14:00
-- Sábado:        09:00 e 11:00

INSERT INTO bfr_availability_slots (date, time, max_bookings, active) VALUES
  -- Semana 14/04
  ('2026-04-14','09:00',1,TRUE), ('2026-04-14','14:00',1,TRUE),
  ('2026-04-15','09:00',1,TRUE), ('2026-04-15','16:30',1,TRUE),
  ('2026-04-16','09:00',1,TRUE), ('2026-04-16','11:00',1,TRUE), ('2026-04-16','14:00',1,TRUE),
  ('2026-04-17','14:00',1,TRUE), ('2026-04-17','16:30',1,TRUE),
  ('2026-04-18','09:00',1,TRUE), ('2026-04-18','14:00',1,TRUE),
  -- Semana 20/04
  ('2026-04-21','09:00',1,TRUE), ('2026-04-21','14:00',1,TRUE),
  ('2026-04-22','09:00',1,TRUE), ('2026-04-22','16:30',1,TRUE),
  ('2026-04-23','09:00',1,TRUE), ('2026-04-23','11:00',1,TRUE), ('2026-04-23','14:00',1,TRUE),
  ('2026-04-24','14:00',1,TRUE), ('2026-04-24','16:30',1,TRUE),
  ('2026-04-25','09:00',1,TRUE), ('2026-04-25','14:00',1,TRUE),
  ('2026-04-26','09:00',1,TRUE), ('2026-04-26','11:00',1,TRUE),
  -- Semana 27/04
  ('2026-04-28','09:00',1,TRUE), ('2026-04-28','14:00',1,TRUE),
  ('2026-04-29','09:00',1,TRUE), ('2026-04-29','16:30',1,TRUE),
  ('2026-04-30','09:00',1,TRUE), ('2026-04-30','11:00',1,TRUE), ('2026-04-30','14:00',1,TRUE),
  -- Semana 04/05
  ('2026-05-04','09:00',1,TRUE), ('2026-05-04','14:00',1,TRUE),
  ('2026-05-05','09:00',1,TRUE), ('2026-05-05','16:30',1,TRUE),
  ('2026-05-06','09:00',1,TRUE), ('2026-05-06','11:00',1,TRUE), ('2026-05-06','14:00',1,TRUE),
  ('2026-05-07','14:00',1,TRUE), ('2026-05-07','16:30',1,TRUE),
  ('2026-05-08','09:00',1,TRUE), ('2026-05-08','14:00',1,TRUE),
  ('2026-05-09','09:00',1,TRUE), ('2026-05-09','11:00',1,TRUE),
  -- Semana 11/05
  ('2026-05-11','09:00',1,TRUE), ('2026-05-11','14:00',1,TRUE),
  ('2026-05-12','09:00',1,TRUE), ('2026-05-12','16:30',1,TRUE),
  ('2026-05-13','09:00',1,TRUE), ('2026-05-13','11:00',1,TRUE), ('2026-05-13','14:00',1,TRUE),
  ('2026-05-14','14:00',1,TRUE), ('2026-05-14','16:30',1,TRUE),
  ('2026-05-15','09:00',1,TRUE), ('2026-05-15','14:00',1,TRUE),
  ('2026-05-16','09:00',1,TRUE), ('2026-05-16','11:00',1,TRUE)
ON CONFLICT (date, time) DO NOTHING;

INSERT INTO bfr_faq (question, answer, "order", active) VALUES
  ('O que é BikeFit e por que preciso fazer?',         'BikeFit é a análise e ajuste biomecânico da posição do ciclista na bicicleta. Uma posição correta evita lesões, aumenta o conforto e melhora a performance — independente do seu nível ou modalidade.', 1, TRUE),
  ('Quanto tempo dura a sessão?',                       'Uma sessão completa dura em média 2 a 3 horas. O tempo varia conforme a complexidade dos ajustes e o tipo de avaliação (básica ou avançada).', 2, TRUE),
  ('Preciso levar minha bicicleta?',                    'Sim! Traga sua bicicleta, seu capacete, sapatilha (se usar), kit de ciclismo e qualquer palmilha ortopédica que utilize. Quanto mais completo o setup, mais precisos serão os ajustes.', 3, TRUE),
  ('O BikeFit serve para qualquer tipo de bicicleta?', 'Sim. Atendemos ciclistas de estrada, MTB, triathlon/TT e ciclismo urbano. Cada modalidade tem suas especificidades e o ajuste é feito de forma personalizada.', 4, TRUE),
  ('Qual a diferença entre BikeFit básico e avançado?', 'O básico cobre os principais ajustes de altura e recuo de selim, alcance e posição dos pedivelas. O avançado inclui análise de movimento em vídeo, análise de força, ajuste de cleats e emissão de relatório completo com todas as medidas.', 5, TRUE),
  ('Vou receber algum documento após a sessão?',        'Sim! Você recebe um relatório completo em PDF com todas as medidas ajustadas, fotos da posição final e recomendações personalizadas para continuar evoluindo.', 6, TRUE),
  ('Com que frequência devo refazer o BikeFit?',        'Recomenda-se revisar a posição anualmente ou sempre que houver mudança significativa: novo equipamento, lesão, perda ou ganho de peso acentuado, ou mudança no objetivo de treino.', 7, TRUE),
  ('Como me preparar para a sessão?',                   'Chegue descansado, com seu equipamento completo e, se possível, com fotos ou vídeos de pedais recentes para compartilhar. Evite treinos extenuantes no dia anterior.', 8, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE bfr_content            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bfr_testimonials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bfr_faq                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bfr_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bfr_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bfr_bookings           ENABLE ROW LEVEL SECURITY;

-- ---------- bfr_content ----------
CREATE POLICY "bfr_content_select_public"
  ON bfr_content FOR SELECT USING (TRUE);

CREATE POLICY "bfr_content_all_admin"
  ON bfr_content FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_testimonials ----------
CREATE POLICY "bfr_testimonials_select_public"
  ON bfr_testimonials FOR SELECT USING (active = TRUE);

CREATE POLICY "bfr_testimonials_all_admin"
  ON bfr_testimonials FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_faq ----------
CREATE POLICY "bfr_faq_select_public"
  ON bfr_faq FOR SELECT USING (active = TRUE);

CREATE POLICY "bfr_faq_all_admin"
  ON bfr_faq FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_settings ----------
CREATE POLICY "bfr_settings_select_public"
  ON bfr_settings FOR SELECT USING (TRUE);

CREATE POLICY "bfr_settings_all_admin"
  ON bfr_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_availability_slots ----------
CREATE POLICY "bfr_slots_select_public"
  ON bfr_availability_slots FOR SELECT USING (active = TRUE);

CREATE POLICY "bfr_slots_all_admin"
  ON bfr_availability_slots FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_bookings ----------
CREATE POLICY "bfr_bookings_insert_public"
  ON bfr_bookings FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "bfr_bookings_all_admin"
  ON bfr_bookings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
