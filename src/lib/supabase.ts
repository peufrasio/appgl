import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      confirmations: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          companions: number
          dietary_restrictions: string | null
          transport: string
          accommodation: string | null
          special_requests: string | null
          status: 'confirmed' | 'pending' | 'cancelled'
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          companions?: number
          dietary_restrictions?: string | null
          transport: string
          accommodation?: string | null
          special_requests?: string | null
          status?: 'confirmed' | 'pending' | 'cancelled'
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          companions?: number
          dietary_restrictions?: string | null
          transport?: string
          accommodation?: string | null
          special_requests?: string | null
          status?: 'confirmed' | 'pending' | 'cancelled'
        }
      }
    }
  }
}