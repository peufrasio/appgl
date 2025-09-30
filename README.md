# 🎵 Sistema de Inscrições - EP "Apaixonado Como Nunca"

Sistema completo para gerenciamento de inscrições e check-in de eventos musicais.

## 🚀 Funcionalidades

- ✅ **Inscrições Online**: Formulário completo com termo de uso de imagem
- ✅ **Painel Administrativo**: Aprovação/rejeição de convidados
- ✅ **Sistema de QR Code**: Geração automática para convidados aprovados
- ✅ **Check-in Digital**: Scanner QR Code + entrada manual
- ✅ **Notificações por Email**: Confirmação automática via Resend
- ✅ **Dashboard Completo**: Estatísticas em tempo real
- ✅ **Responsivo**: Funciona perfeitamente em mobile e desktop

## 🗄️ Configuração do Banco de Dados

### 1. Execute este SQL no seu painel do Supabase:

```sql
-- Criar tabela de convidados
CREATE TABLE IF NOT EXISTS guests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    instagram TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    has_companion BOOLEAN DEFAULT false,
    image_consent BOOLEAN DEFAULT false,
    qr_code TEXT UNIQUE,
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de configurações (opcional)
CREATE TABLE IF NOT EXISTS event_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_status ON guests(status);
CREATE INDEX IF NOT EXISTS idx_guests_qr_code ON guests(qr_code);
CREATE INDEX IF NOT EXISTS idx_guests_checked_in ON guests(checked_in);

-- Habilitar RLS (Row Level Security)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento
CREATE POLICY "Allow all operations on guests" ON guests FOR ALL USING (true);
CREATE POLICY "Allow all operations on event_settings" ON event_settings FOR ALL USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_settings_updated_at BEFORE UPDATE ON event_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Configurar Variáveis de Ambiente

O sistema detecta automaticamente o uso do Supabase e configura as variáveis. Você pode:

- **Opção A**: Conectar sua conta Supabase via OAuth nas Configurações do Projeto
- **Opção B**: Configurar manualmente se aparecer o banner laranja
- **Opção C**: Fornecer suas credenciais diretamente no chat

### 3. Configurar Email (Opcional)

Para envio de confirmações por email, configure:

```env
RESEND_API_KEY=sua_chave_resend
EMAIL_FROM=evento@seudominio.com
```

## 🎯 Como Usar

### Para Convidados:
1. Acesse a página principal
2. Clique em "Confirmar Presença"
3. Preencha o formulário completo
4. Aguarde aprovação do administrador
5. Receba email com QR Code quando aprovado

### Para Administradores:
1. Acesse `/admin` (senha: `admin123`)
2. Visualize todas as inscrições
3. Aprove ou rejeite convidados
4. Sistema envia email automaticamente para aprovados

### Para Check-in:
1. Acesse `/checkin` (senha: `checkin123`)
2. Use o scanner QR Code ou entrada manual
3. Confirme presença dos convidados
4. Visualize estatísticas em tempo real

## 🔧 Senhas do Sistema

- **Admin**: `admin123`
- **Check-in**: `checkin123`

## 📱 Recursos Mobile

- Interface totalmente responsiva
- Scanner QR Code funciona em dispositivos móveis
- Formulários otimizados para touch
- Navegação intuitiva

## 🎨 Personalização

O sistema usa cores modernas com gradientes purple/pink. Para personalizar:

- Modifique as classes Tailwind nos componentes
- Ajuste o tema no arquivo de configuração
- Personalize templates de email em `src/lib/supabase.ts`

## 🚨 Troubleshooting

### Scanner QR não funciona:
- Verifique permissões de câmera no navegador
- Use entrada manual como alternativa
- Teste em dispositivo diferente

### Emails não enviados:
- Configure RESEND_API_KEY corretamente
- Verifique domínio verificado no Resend
- Use entrada manual para aprovações

### Erro de banco de dados:
- Execute o SQL de configuração completo
- Verifique conexão com Supabase
- Confirme políticas RLS configuradas

## 📊 Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx          # Página principal (inscrições)
│   ├── admin/page.tsx    # Painel administrativo
│   ├── checkin/page.tsx  # Sistema de check-in
│   └── api/
│       └── send-email/   # API para envio de emails
├── lib/
│   └── supabase.ts       # Configurações e funções do banco
└── components/ui/        # Componentes Shadcn/UI
```

## 🎵 Sobre o Evento

Sistema desenvolvido para a gravação do EP "Apaixonado Como Nunca" do Gabriel Lima, com foco em:

- Gestão profissional de convidados
- Controle de acesso seguro
- Experiência mobile-first
- Automação completa do processo

---

**Desenvolvido com ❤️ usando Next.js 15, Supabase, Tailwind CSS e Shadcn/UI**