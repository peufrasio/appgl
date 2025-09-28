import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      guests: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          instagram: string | null
          has_companion: boolean
          image_consent: boolean
          status: 'pending' | 'approved' | 'rejected'
          qr_code: string | null
          checked_in: boolean
          checked_in_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          instagram?: string | null
          has_companion?: boolean
          image_consent?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          qr_code?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          instagram?: string | null
          has_companion?: boolean
          image_consent?: boolean
          status?: 'pending' | 'approved' | 'rejected'
          qr_code?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
        }
      }
      app_settings: {
        Row: {
          id: string
          whatsapp_group_link: string | null
          event_name: string
          event_date: string
          event_location: string
          event_address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          whatsapp_group_link?: string | null
          event_name: string
          event_date: string
          event_location: string
          event_address: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          whatsapp_group_link?: string | null
          event_name?: string
          event_date?: string
          event_location?: string
          event_address?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Função para enviar email (simulação - em produção usar serviço real)
export const sendConfirmationEmail = async (guest: any, qrCode: string) => {
  try {
    // Em produção, integrar com serviço de email como SendGrid, Resend, etc.
    console.log(`
      📧 EMAIL ENVIADO PARA: ${guest.email}
      
      Assunto: Confirmação de Presença - ${guest.event || 'Evento'}
      
      Olá ${guest.name}!
      
      Sua presença foi confirmada para o evento!
      
      📅 Data: ${guest.date || 'A definir'}
      📍 Local: ${guest.location || 'A definir'}
      
      Seu QR Code de acesso está em anexo.
      Apresente este código na entrada do evento.
      
      Nos vemos lá! 🎉
      
      ---
      QR Code: ${qrCode ? 'Anexado' : 'Não gerado'}
    `)
    
    return { success: true, message: 'Email enviado com sucesso' }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, message: 'Erro ao enviar email' }
  }
}