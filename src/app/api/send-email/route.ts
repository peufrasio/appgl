import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    // Usar a API key fornecida diretamente
    const RESEND_API_KEY = 're_E4YXbKsU_Gkqu3LkcWeqDaTCqRy1jMjh9'
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY não configurada')
      return NextResponse.json(
        { 
          error: 'Serviço de email não configurado. Entre em contato com o administrador.',
          success: false,
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Verificar se o corpo da requisição é válido
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error('Erro ao parsear JSON da requisição:', parseError)
      return NextResponse.json(
        { 
          error: 'Dados da requisição inválidos',
          success: false,
          timestamp: new Date().toISOString()
        },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { to, name, qrCodeData, qrCodeImage, pdfBuffer } = requestBody

    // Validar dados obrigatórios
    if (!to || !name || !qrCodeImage) {
      return NextResponse.json(
        { 
          error: 'Dados obrigatórios não fornecidos (email, nome ou QR Code)',
          success: false,
          timestamp: new Date().toISOString()
        },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Inicializar Resend com a API key
    const resend = new Resend(RESEND_API_KEY)

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎵 Confirmação de Presença – Gravação do EP "Apaixonado Como Nunca"</title>
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
            margin-bottom: 30px;
          }
          .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
          }
          .title {
            color: #2c3e50;
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .greeting {
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 15px;
          }
          .confirmation {
            font-size: 16px;
            margin-bottom: 20px;
            color: #34495e;
          }
          .highlight {
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
            font-weight: bold;
            color: #2c3e50;
          }
          .event-details {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border-left: 5px solid #667eea;
          }
          .event-details h3 {
            color: #2c3e50;
            margin: 0 0 15px 0;
            font-size: 20px;
          }
          .detail-item {
            margin-bottom: 10px;
            font-size: 16px;
            color: #34495e;
          }
          .detail-item strong {
            color: #2c3e50;
          }
          .qr-section {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            border: 2px dashed #dee2e6;
          }
          .qr-section h3 {
            color: #2c3e50;
            margin: 0 0 15px 0;
            font-size: 20px;
          }
          .qr-code {
            max-width: 250px;
            height: auto;
            margin: 20px 0;
            border: 3px solid white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          .qr-note {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 15px;
            font-weight: bold;
          }
          .qr-fallback {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 10px;
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
            color: #2c3e50;
          }
          .brand {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 5px;
          }
          .tagline {
            font-size: 14px;
            color: #7f8c8d;
            font-style: italic;
          }
          .emoji {
            font-size: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://i.postimg.cc/XvsKmNKW/ESCALA-MUSIC-NOVO-LOGO.png" alt="EscalaMusic Logo" class="logo">
          </div>

          <div class="greeting">
            Olá, ${name}!
          </div>

          <div class="confirmation">
            Parabéns! Sua presença foi <strong>CONFIRMADA</strong> para a gravação do EP "Apaixonado Como Nunca" <span class="emoji">🎉</span>
          </div>

          <div class="highlight">
            <span class="emoji">✨</span> Vai ser incrível ter você com a gente nesse momento especial! <span class="emoji">✨</span>
          </div>

          <div class="event-details">
            <h3><span class="emoji">🎬</span> Detalhes do Evento</h3>
            <div class="detail-item">
              <strong><span class="emoji">📅</span> Data:</strong> 09/10 às 15h
            </div>
            <div class="detail-item">
              <strong><span class="emoji">📍</span> Local:</strong> Prainha Natal – ao lado do Hotel Imirá
            </div>
            <div class="detail-item">
              <strong><span class="emoji">🗺️</span> Endereço:</strong> Av. Senador Dinarte Mariz, Via Costeira, 4077 - B, Natal - RN, 59090-002
            </div>
          </div>

          <div class="qr-section">
            <h3><span class="emoji">📱</span> Seu QR Code de Acesso</h3>
            <p>Apresente o código abaixo na entrada do evento.</p>
            <p style="font-size: 14px; color: #7f8c8d;">(Código único e intransferível)</p>
            
            <img src="data:image/png;base64,${qrCodeImage}" alt="QR Code de Acesso" class="qr-code">
            
            <div class="qr-fallback">
              <strong>⚠️ Caso o QR Code não seja exibido corretamente, clique aqui para visualizar seu código</strong>
            </div>
          </div>

          <div class="instructions">
            <h4><span class="emoji">📋</span> Instruções Importantes</h4>
            <ul>
              <li>Chegue com antecedência para facilitar o check-in.</li>
              <li>Apresente este QR Code na entrada.</li>
              <li>Salve uma captura de tela ou acesse o link acima para abrir o código.</li>
              <li>Traga um documento com foto para confirmação.</li>
              <li>Vista-se adequadamente para as gravações.</li>
              <li>Mantenha o celular carregado para apresentar o código.</li>
            </ul>
          </div>

          <div class="highlight">
            <span class="emoji">🎵</span> Prepare-se para viver momentos inesquecíveis! <span class="emoji">🎵</span>
          </div>

          <div class="footer">
            <div class="brand">EscalaMusic</div>
            <div class="tagline">ESCALANDO SUCESSOS</div>
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

    // Enviar email usando Resend
    const data = await resend.emails.send({
      from: 'EscalaMusic <gabriellima.art@gabriellima.art>',
      to: [to],
      subject: `🎵 Confirmação de Presença – Gravação do EP "Apaixonado Como Nunca"`,
      html: emailHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    console.log('Email enviado com sucesso:', data)

    return NextResponse.json(
      { 
        success: true, 
        data,
        message: 'Email enviado com sucesso',
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

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
    
    // SEMPRE retornar JSON válido, nunca HTML
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false,
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Erro desconhecido') : undefined
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

// Garantir que outros métodos HTTP também retornem JSON
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Método não permitido. Use POST para enviar emails.',
      success: false,
      timestamp: new Date().toISOString()
    },
    { 
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Método não permitido. Use POST para enviar emails.',
      success: false,
      timestamp: new Date().toISOString()
    },
    { 
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Método não permitido. Use POST para enviar emails.',
      success: false,
      timestamp: new Date().toISOString()
    },
    { 
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}