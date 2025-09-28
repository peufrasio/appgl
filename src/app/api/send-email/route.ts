import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Inicializar Resend apenas se a API key estiver disponível
let resend: Resend | null = null

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
} catch (error) {
  console.error('Erro ao inicializar Resend:', error)
}

export async function POST(request: NextRequest) {
  try {
    const { to, name, qrCodeData, qrCodeImage, pdfBuffer } = await request.json()

    // Verificar se a API key está configurada
    if (!process.env.RESEND_API_KEY || !resend) {
      console.error('RESEND_API_KEY não configurada')
      return NextResponse.json(
        { 
          error: 'Serviço de email não configurado. Entre em contato com o administrador.',
          success: false,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Validar dados obrigatórios
    if (!to || !name || !qrCodeImage) {
      return NextResponse.json(
        { 
          error: 'Dados obrigatórios não fornecidos (email, nome ou QR Code)',
          success: false,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação de Presença - EscalaMusic</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #e9ecef;
          }
          .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
          }
          .title {
            color: #2c3e50;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
          .subtitle {
            color: #7f8c8d;
            font-size: 18px;
            margin: 10px 0 0 0;
          }
          .content {
            margin: 30px 0;
          }
          .greeting {
            font-size: 20px;
            color: #2c3e50;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 25px;
            color: #34495e;
          }
          .event-info {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
            text-align: center;
          }
          .event-info h3 {
            margin: 0 0 15px 0;
            font-size: 22px;
            font-weight: bold;
          }
          .event-details {
            font-size: 16px;
            line-height: 1.6;
          }
          .qr-section {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            border: 2px dashed #dee2e6;
          }
          .qr-code {
            max-width: 250px;
            height: auto;
            margin: 20px 0;
            border: 3px solid white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          .instructions {
            background: #e8f5e8;
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
            border-left: 5px solid #28a745;
          }
          .instructions h4 {
            color: #155724;
            margin: 0 0 15px 0;
            font-size: 18px;
          }
          .instructions ul {
            margin: 0;
            padding-left: 20px;
            color: #155724;
          }
          .instructions li {
            margin-bottom: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #e9ecef;
            color: #7f8c8d;
          }
          .contact-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .contact-info h4 {
            color: #2c3e50;
            margin: 0 0 15px 0;
          }
          .highlight {
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
            font-weight: bold;
            color: #2c3e50;
          }
          .emoji {
            font-size: 24px;
            margin: 0 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://i.postimg.cc/XvsKmNKW/ESCALA-MUSIC-NOVO-LOGO.png" alt="EscalaMusic Logo" class="logo">
            <h1 class="title">🎵 Confirmação de Presença</h1>
            <p class="subtitle">Gravação do EP "Apaixonado Como Nunca"</p>
          </div>

          <div class="content">
            <div class="greeting">
              Olá, ${name}! <span class="emoji">👋</span>
            </div>

            <div class="message">
              <strong>Parabéns!</strong> Sua presença foi <span style="color: #28a745; font-weight: bold;">CONFIRMADA</span> para a gravação do EP "Apaixonado Como Nunca"! <span class="emoji">🎉</span>
            </div>

            <div class="highlight">
              <span class="emoji">✨</span> Vai ser lindo ter você com a gente neste momento especial! <span class="emoji">✨</span>
            </div>

            <div class="event-info">
              <h3><span class="emoji">🎬</span> Detalhes do Evento</h3>
              <div class="event-details">
                <strong>📅 Data:</strong> 09/10 às 15h<br>
                <strong>📍 Local:</strong> Prainha Natal – ao lado do Hotel Imirá<br>
                <strong>🗺️ Endereço:</strong> Av. Senador Dinarte Mariz, Via Costeira, 4077 - B, Natal - RN, 59090-002
              </div>
            </div>

            <div class="qr-section">
              <h3 style="color: #2c3e50; margin-bottom: 15px;">
                <span class="emoji">📱</span> Seu QR Code de Acesso
              </h3>
              <p style="color: #7f8c8d; margin-bottom: 20px;">
                Apresente este código na entrada do evento
              </p>
              <img src="data:image/png;base64,${qrCodeImage}" alt="QR Code de Acesso" class="qr-code">
              <p style="color: #7f8c8d; font-size: 14px; margin-top: 15px;">
                <strong>Código único e intransferível</strong>
              </p>
            </div>

            <div class="instructions">
              <h4><span class="emoji">📋</span> Instruções Importantes:</h4>
              <ul>
                <li><strong>Chegue com antecedência</strong> para facilitar o check-in</li>
                <li><strong>Apresente este QR Code</strong> na entrada do evento</li>
                <li><strong>Guarde uma captura de tela</strong> como backup</li>
                <li><strong>Traga documento com foto</strong> para confirmação</li>
                <li><strong>Vista-se adequadamente</strong> para as gravações</li>
                <li><strong>Mantenha o celular carregado</strong> para apresentar o QR Code</li>
              </ul>
            </div>

            <div class="contact-info">
              <h4><span class="emoji">📞</span> Contato e Suporte:</h4>
              <p><strong>WhatsApp:</strong> (11) 99635-9550</p>
              <p><strong>E-mail:</strong> contato@escalamusic.com.br</p>
              <p style="margin-top: 15px; color: #7f8c8d;">
                <em>Entre em contato conosco se tiver qualquer dúvida!</em>
              </p>
            </div>

            <div class="highlight">
              <span class="emoji">🎵</span> Prepare-se para viver momentos inesquecíveis! <span class="emoji">🎵</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>EscalaMusic</strong></p>
            <p>Criando momentos musicais únicos</p>
            <p style="font-size: 12px; margin-top: 20px;">
              Este e-mail foi enviado automaticamente. Por favor, não responda.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Preparar anexos
    const attachments = []
    
    // Anexar PDF se fornecido
    if (pdfBuffer) {
      attachments.push({
        filename: `qr-code-${name.replace(/\s+/g, '-')}.pdf`,
        content: Buffer.from(pdfBuffer, 'base64'),
        contentType: 'application/pdf'
      })
    }

    console.log('Tentando enviar email para:', to)

    const data = await resend.emails.send({
      from: 'EscalaMusic <noreply@escalamusic.com.br>',
      to: [to],
      subject: `🎵 Confirmação de Presença - EP "Apaixonado Como Nunca" - ${name}`,
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    console.log('Email enviado com sucesso:', data)

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Email enviado com sucesso',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro detalhado ao enviar email:', error)
    
    // Tratamento específico de erros
    let errorMessage = 'Erro interno do servidor ao enviar email'
    let statusCode = 500
    
    if (error instanceof Error) {
      console.error('Mensagem do erro:', error.message)
      console.error('Stack trace:', error.stack)
      
      // Verificar tipos específicos de erro da Resend
      if (error.message.includes('API key')) {
        errorMessage = 'Chave da API Resend inválida ou não configurada'
        statusCode = 401
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Limite de envios excedido. Tente novamente em alguns minutos'
        statusCode = 429
      } else if (error.message.includes('invalid email') || error.message.includes('400')) {
        errorMessage = 'Endereço de email inválido'
        statusCode = 400
      } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
        errorMessage = 'Não autorizado - verifique a configuração da API'
        statusCode = 401
      } else if (error.message.includes('forbidden') || error.message.includes('403')) {
        errorMessage = 'Acesso negado - verifique as permissões da API'
        statusCode = 403
      } else {
        errorMessage = `Erro no serviço de email: ${error.message}`
      }
    }
    
    // Sempre retornar JSON válido
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Erro desconhecido' : undefined
      },
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// Função para verificar se o serviço está configurado
export async function GET() {
  return NextResponse.json({
    status: 'API de email ativa',
    configured: !!process.env.RESEND_API_KEY,
    timestamp: new Date().toISOString()
  })
}