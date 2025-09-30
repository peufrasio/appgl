import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Guest {
  id: string
  name: string
  email: string
  phone: string
  instagram?: string
  status: 'pending' | 'approved' | 'rejected'
  has_companion: boolean
  image_consent: boolean
  qr_code?: string
  checked_in: boolean
  checked_in_at?: string
  created_at: string
  updated_at: string
}

export interface EventSettings {
  id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

// Guest functions
export const createGuest = async (guestData: Partial<Guest>) => {
  const { data, error } = await supabase
    .from('guests')
    .insert([guestData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getGuests = async () => {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const updateGuest = async (id: string, updates: Partial<Guest>) => {
  const { data, error } = await supabase
    .from('guests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getGuestByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const getGuestByQRCode = async (qrCode: string) => {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('qr_code', qrCode)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Settings functions
export const getSetting = async (key: string) => {
  try {
    const { data, error } = await supabase
      .from('event_settings')
      .select('value')
      .eq('key', key)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.value
  } catch (error: any) {
    // Se a tabela não existir, retorna null silenciosamente
    if (error?.message?.includes('Could not find the table') || 
        error?.message?.includes('schema cache')) {
      return null
    }
    throw error
  }
}

export const updateSetting = async (key: string, value: string) => {
  try {
    const { data, error } = await supabase
      .from('event_settings')
      .upsert({ key, value })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error: any) {
    // Se a tabela não existir, apenas loga o erro e retorna null
    if (error?.message?.includes('Could not find the table') || 
        error?.message?.includes('schema cache')) {
      console.warn('Tabela event_settings não encontrada. Configurações não serão salvas.')
      return null
    }
    throw error
  }
}

// Generate QR Code
export const generateQRCode = (guestId: string): string => {
  return `EVENT_${guestId}_${Date.now()}`
}

// Email template
export const generateEmailTemplate = (guest: Guest) => {
  return {
    subject: `🎵 Confirmação - EP "Apaixonado Como Nunca"`,
    html: `
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
            <div style="font-family: monospace; font-size: 14px; background: #f1f5f9; padding: 15px; border-radius: 5px; margin: 10px 0;">
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
  }
}