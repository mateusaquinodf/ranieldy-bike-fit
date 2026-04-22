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
  category    TEXT NOT NULL DEFAULT '',
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  "order"     INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE bfr_faq ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';

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

-- FAQ da landing (substitui entradas anteriores ao reaplicar este bloco)
DELETE FROM bfr_faq;

INSERT INTO bfr_faq (category, question, answer, "order", active) VALUES
  ('SOBRE O SERVIÇO', 'O que é o Bike Fit e pra que serve?', $$O Bike Fit é o ajuste preciso da sua bicicleta ao seu corpo. Através de análise de movimento, medidas antropométricas e testes funcionais, a bike é regulada de acordo com a sua anatomia e objetivo — para você pedalar com mais conforto, desempenho e sem dores.$$::text, 1, TRUE),
  ('SOBRE O SERVIÇO', 'Quanto tempo dura a sessão?', $$A sessão tem duração de até 3 horas. Esse tempo inclui a entrevista sobre seu histórico e objetivos, os testes de flexibilidade e função muscular, a análise tridimensional da pedalada com sensores, os ajustes na bike e a entrega do laudo completo com resultado final e imagens.$$::text, 2, TRUE),
  ('SOBRE O SERVIÇO', 'O que está incluído no Bike Fit?', $$A sessão completa inclui:

• Entrevista sobre histórico, queixas e objetivos do ciclista
• Medidas antropométricas
• Testes de flexibilidade e função muscular
• Análise tridimensional da pedalada com sensores em pontos anatômicos
• Ajustes completos na bicicleta
• Laudo completo com resultado final e imagens$$::text, 3, TRUE),
  ('SOBRE O SERVIÇO', 'Qual tecnologia é usada na análise?', $$Utilizamos dois softwares profissionais de referência no mercado de bike fitting: LEOMO e VELOGIC STUDIO.

O LEOMO é um sistema de captação de movimento com sensores afixados em pontos anatômicos do ciclista, que avalia em tempo real a dinâmica da pedalada — identificando assimetrias, ângulos articulares e padrões de movimento.

O VELOGIC STUDIO complementa a análise com ferramentas de posicionamento e modelagem tridimensional, garantindo ajustes ainda mais precisos e personalizados ao seu corpo e objetivo.

Essa combinação de tecnologias é o que diferencia um Bike Fit profissional de um simples ajuste de bike.$$::text, 4, TRUE),
  ('PARA QUEM É', 'O Bike Fit é só para ciclistas avançados ou competidores?', $$Não. O atendimento é para todos os níveis — do iniciante que acabou de comprar a primeira bike ao atleta que compete em alto nível. O Bike Fit é especialmente recomendado para quem sente dor ao pedalar, quer melhorar a performance ou acabou de adquirir uma bicicleta nova.$$::text, 5, TRUE),
  ('PARA QUEM É', 'Funciona para qual tipo de bicicleta?', $$O serviço atende bicicletas de estrada (speed), mountain bike (MTB), bicicletas de triathlon e cicloturismo. Em caso de dúvida sobre o seu tipo de bike, entre em contato antes de agendar.$$::text, 6, TRUE),
  ('PARA QUEM É', 'Tenho dor ao pedalar. O Bike Fit resolve?', $$Dores no joelho, lombar, pescoço e desconforto no selim são frequentemente causadas por uma bike desajustada ao corpo. O Bike Fit identifica essas causas e corrige os ajustes. Em caso de dores com origem clínica, o profissional pode indicar acompanhamento médico complementar.$$::text, 7, TRUE),
  ('VALORES E PAGAMENTO', 'Quanto custa o Bike Fit?', $$• Sessão completa para novos clientes: R$ 400,00
• Cliente antigo com bicicleta nova: R$ 300,00
• Troca de componente, ajustes ou retorno: R$ 150,00
• Ajuste de tacos: a partir de R$ 30,00
• Segunda bicicleta na mesma sessão: 50% de desconto
• Outros serviços: valor a combinar$$::text, 8, TRUE),
  ('VALORES E PAGAMENTO', 'Quais são as formas de pagamento?', $$O pagamento é aceito via Pix e dinheiro.$$::text, 9, TRUE),
  ('ANTES DE VIR — PREPARO E POLÍTICA', 'O que preciso levar para a sessão?', $$Traga sua bicicleta, vestimenta adequada para pedalar (bermuda, camisa e sapatilha de ciclismo, se tiver) e, se usar, seus próprios pedais e tacos. Venha preparado como se fosse pedalar normalmente.$$::text, 10, TRUE),
  ('ANTES DE VIR — PREPARO E POLÍTICA', 'Minha bike precisa estar em boas condições?', $$Sim. A bike deve estar limpa e em bom estado de funcionamento. Caso o serviço não possa ser realizado por conta de equipamentos inadequados, mau estado da bicicleta ou falta de vestimenta adequada, a sessão será cobrada normalmente e o serviço reagendado para outra data.$$::text, 11, TRUE),
  ('ANTES DE VIR — PREPARO E POLÍTICA', 'Onde o atendimento é realizado?', $$O atendimento é presencial em Brasília — DF. O endereço exato é confirmado no momento do agendamento.$$::text, 12, TRUE),
  ('ANTES DE VIR — PREPARO E POLÍTICA', 'Como faço para agendar?', $$É só clicar no botão de agendamento na landing page ou entrar em contato diretamente com o Ranieldy pelo WhatsApp. As vagas são limitadas por semana, então é recomendado garantir a sua com antecedência.$$::text, 13, TRUE);

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
