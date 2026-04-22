-- ============================================================
-- BikeFit — Schema Supabase v1.1
-- Todas as tabelas usam o prefixo bfr_ (BFR-)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- Habilita a extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Remoção definitiva do módulo de agendamento
DROP TABLE IF EXISTS public.bfr_bookings CASCADE;
DROP TABLE IF EXISTS public.bfr_availability_slots CASCADE;

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

ALTER TABLE bfr_testimonials ADD COLUMN IF NOT EXISTS bike_model   TEXT;
ALTER TABLE bfr_testimonials ADD COLUMN IF NOT EXISTS approved     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bfr_testimonials ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE bfr_testimonials ADD COLUMN IF NOT EXISTS source       TEXT NOT NULL DEFAULT 'admin';

-- Mantém depoimentos existentes visíveis após migração
UPDATE bfr_testimonials
SET approved = TRUE
WHERE approved IS DISTINCT FROM TRUE
  AND source = 'admin';

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

-- Eventos de analytics da LP
CREATE TABLE IF NOT EXISTS bfr_analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  TEXT NOT NULL,
  page        TEXT NOT NULL DEFAULT 'landing',
  session_id  TEXT,
  event_meta  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bfr_analytics_events_name_created
  ON bfr_analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bfr_analytics_events_created_at
  ON bfr_analytics_events (created_at DESC);


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

INSERT INTO bfr_testimonials (name, modality, bike_model, text, rating, photo_url, active, approved, source, "order") VALUES
  ('Carlos M.',    'Ciclismo de Estrada', 'Specialized Tarmac SL7', 'Após o BikeFit resolvi a dor no joelho que me perseguia há meses. Minha posição ficou muito mais eficiente e agora pedalo com prazer novamente.',                      5, 'https://i.pravatar.cc/150?img=11', TRUE, TRUE, 'admin', 1),
  ('Ana Paula R.', 'Triathlon',           'Cervelo P-Series',       'Profissional incrível! Ajustou minha posição para as três modalidades e meu tempo no ciclismo melhorou significativamente na próxima prova.',                           5, 'https://i.pravatar.cc/150?img=47', TRUE, TRUE, 'admin', 2),
  ('Diego S.',     'MTB',                 'Trek Supercaliber',      'Valia cada centavo. Saí da sessão com a bike completamente regulada e um relatório detalhado de todas as medidas. Super recomendo!',                                     5, 'https://i.pravatar.cc/150?img=32', TRUE, TRUE, 'admin', 3),
  ('Fernanda L.',  'Ciclismo Urbano',     'Caloi City Tour',        'Comecei a usar a bike para trabalhar e estava com dores nas costas toda semana. Depois do BikeFit, zero desconforto. Simplesmente incrível.',                           5, 'https://i.pravatar.cc/150?img=44', TRUE, TRUE, 'admin', 4),
  ('Rodrigo T.',   'Ciclismo de Estrada', 'Cannondale CAAD13',      'Ganhei mais de 15W no FTP só com o ajuste de posição. O Ranieldy é extremamente técnico e atencioso. Voltarei para revisão anual com certeza.',                        5, 'https://i.pravatar.cc/150?img=68', TRUE, TRUE, 'admin', 5)
ON CONFLICT DO NOTHING;

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
ALTER TABLE bfr_analytics_events   ENABLE ROW LEVEL SECURITY;

-- ---------- bfr_content ----------
DROP POLICY IF EXISTS "bfr_content_select_public" ON bfr_content;
DROP POLICY IF EXISTS "bfr_content_all_admin" ON bfr_content;
CREATE POLICY "bfr_content_select_public"
  ON bfr_content FOR SELECT USING (TRUE);

CREATE POLICY "bfr_content_all_admin"
  ON bfr_content FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_testimonials ----------
DROP POLICY IF EXISTS "bfr_testimonials_select_public" ON bfr_testimonials;
DROP POLICY IF EXISTS "bfr_testimonials_insert_public" ON bfr_testimonials;
DROP POLICY IF EXISTS "bfr_testimonials_all_admin" ON bfr_testimonials;
CREATE POLICY "bfr_testimonials_select_public"
  ON bfr_testimonials FOR SELECT USING (active = TRUE AND approved = TRUE);

CREATE POLICY "bfr_testimonials_insert_public"
  ON bfr_testimonials FOR INSERT
  WITH CHECK (
    source = 'public_form'
    AND approved = FALSE
    AND active = TRUE
    AND rating BETWEEN 1 AND 5
  );

CREATE POLICY "bfr_testimonials_all_admin"
  ON bfr_testimonials FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_faq ----------
DROP POLICY IF EXISTS "bfr_faq_select_public" ON bfr_faq;
DROP POLICY IF EXISTS "bfr_faq_all_admin" ON bfr_faq;
CREATE POLICY "bfr_faq_select_public"
  ON bfr_faq FOR SELECT USING (active = TRUE);

CREATE POLICY "bfr_faq_all_admin"
  ON bfr_faq FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_settings ----------
DROP POLICY IF EXISTS "bfr_settings_select_public" ON bfr_settings;
DROP POLICY IF EXISTS "bfr_settings_all_admin" ON bfr_settings;
CREATE POLICY "bfr_settings_select_public"
  ON bfr_settings FOR SELECT USING (TRUE);

CREATE POLICY "bfr_settings_all_admin"
  ON bfr_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ---------- bfr_analytics_events ----------
DROP POLICY IF EXISTS "bfr_analytics_insert_public" ON bfr_analytics_events;
DROP POLICY IF EXISTS "bfr_analytics_select_admin" ON bfr_analytics_events;
CREATE POLICY "bfr_analytics_insert_public"
  ON bfr_analytics_events FOR INSERT
  WITH CHECK (
    event_name IN ('page_view', 'cta_booking_click', 'email_fab_click')
    AND char_length(coalesce(page, '')) <= 64
  );

CREATE POLICY "bfr_analytics_select_admin"
  ON bfr_analytics_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
