import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import QRCode from 'qrcode'
import { supabase, generateEmailTemplate } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { guestId, guestEmail, guestName, qrCode } = await request.json()

    if (!guestId || !guestEmail || !guestName || !qrCode) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Get guest data
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      )
    }

    // Generate QR Code image as base64
    const qrCodeDataURL = await QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#7c3aed',
        light: '#ffffff'
      }
    })

    // Generate email template
    const emailTemplate = generateEmailTemplate(guest)

    // Enhanced email HTML with embedded QR Code image
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; margin-bottom: 10px;">EP "Apaixonado Como Nunca"</h1>
          <p style="color: #666; font-size: 18px;">Sua presença foi confirmada! 🎉</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 15px 0;">Olá, ${guest.name}!</h2>
          <p style="color: white; margin: 0; font-size: 16px;">Você está oficialmente confirmado para o evento!</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
          <h3 style="color: #374151; margin-top: 0;">📅 Detalhes do Evento</h3>
          <p style="margin: 5px 0;"><strong>Data:</strong> 09 de Outubro de 2024</p>
          <p style="margin: 5px 0;"><strong>Horário:</strong> 15:00h</p>
          <p style="margin: 5px 0;"><strong>Local:</strong> Prainha Natal – ao lado do Hotel Imirá</p>
          <p style="margin: 5px 0;"><strong>Endereço:</strong> Av. Senador Dinarte Mariz, Via Costeira, 4077 - B, Natal - RN</p>
          ${guest.has_companion ? `<p style="margin: 5px 0;"><strong>Acompanhante:</strong> Sim</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="background: white; padding: 20px; border-radius: 10px; border: 2px dashed #7c3aed; display: inline-block;">
            <h3 style="color: #7c3aed; margin-top: 0;">🎫 Seu QR Code</h3>
            <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 200px; margin: 10px 0;" />
            <div style="font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 10px; border-radius: 5px; margin: 10px 0;">
              ${guest.qr_code}
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">Apresente este código na entrada do evento</p>
          </div>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
          <h4 style="color: #92400e; margin-top: 0;">⚠️ Importante</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px;">
            <li>Chegue com 30 minutos de antecedência</li>
            <li>Apresente o QR Code na entrada</li>
            <li>Traga um documento com foto</li>
            ${guest.has_companion ? '<li>Seu acompanhante deve estar com você</li>' : ''}
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; margin: 0;">Nos vemos lá! 🎵</p>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Gabriel Lima</p>
        </div>
      </div>
    `

    // Send email using Resend with HTML
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'evento@gabriellima.com',
      to: [guestEmail],
      subject: emailTemplate.subject,
      html: emailHtml,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return NextResponse.json(
        { error: 'Erro ao enviar email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado com sucesso',
      emailId: data?.id 
    })

  } catch (error) {
    console.error('Erro na API de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}