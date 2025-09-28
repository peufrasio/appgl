'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'
import { 
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  UserPlus, 
  Settings,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Plus,
  Share2,
  MessageCircle,
  QrCode,
  UserCheck,
  Camera,
  Link,
  Send,
  Eye,
  Instagram,
  Check,
  X,
  Shield,
  LogIn,
  Scan,
  AlertCircle,
  Loader2,
  CameraOff,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Screen = 'welcome' | 'form' | 'success' | 'admin' | 'checkin'

interface Guest {
  id: string
  created_at: string
  name: string
  email: string
  phone: string
  instagram: string
  has_companion: boolean
  accepted_terms: boolean
  status: 'pending' | 'approved' | 'rejected'
  qr_code: string | null
  checked_in: boolean
  updated_at: string | null
  timestamp: string
}

interface AppSettings {
  id: string
  whatsapp_group_link: string | null
  event_name: string
  event_date: string
  event_location: string
  event_address: string
}

interface FormData {
  name: string
  email: string
  phone: string
  instagram: string
  has_companion: boolean
  accepted_terms: boolean
}

export default function EventApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    has_companion: false,
    accepted_terms: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [checkinPassword, setCheckinPassword] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [isCheckinAuthenticated, setIsCheckinAuthenticated] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({
    id: '1',
    whatsapp_group_link: '',
    event_name: 'Gravação do EP "Apaixonado Como Nunca"',
    event_date: '09/10 às 15h',
    event_location: 'Prainha Natal – ao lado do Hotel Imirá',
    event_address: 'Av. Senador Dinarte Mariz, Via Costeira, 4077 - B, Natal - RN, 59090-002'
  })
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestEmail, setNewGuestEmail] = useState('')
  const [isAddingGuest, setIsAddingGuest] = useState(false)
  const [qrScannerOpen, setQrScannerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings)
  const [termsText, setTermsText] = useState('')
  const [qrScanInput, setQrScanInput] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  
  // Estados para o scanner de QR Code
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [lastScannedCode, setLastScannedCode] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)

  // Dados do evento
  const eventInfo = {
    title: settings.event_name,
    date: settings.event_date,
    location: settings.event_location,
    address: settings.event_address,
    whatsapp: '(11) 99635-9550',
    email: 'contato@escalamusic.com.br'
  }

  // Inicializar banco de dados
  useEffect(() => {
    loadSettings()
    generateTermsText()
  }, [])

  // Cleanup do scanner quando componente desmonta
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  // Gerar texto do termo automaticamente
  const generateTermsText = () => {
    const terms = `TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM

Eu, ${formData.name || '[NOME]'}, portador(a) do e-mail ${formData.email || '[EMAIL]'} e telefone ${formData.phone || '[TELEFONE]'}, AUTORIZO de forma gratuita e por prazo indeterminado, o uso da minha imagem em fotos e/ou vídeos, para fins de divulgação do evento "${eventInfo.title}" realizado em ${eventInfo.date} no local ${eventInfo.location}.

A presente autorização é concedida a título gratuito, abrangendo o uso da imagem acima mencionada em todo território nacional e no exterior, em todas as suas modalidades e, em destaque, das seguintes formas: (I) outdoor, cartazes, folhetos em geral (encartes, mala direta, catálogo, etc.); (II) mídia eletrônica (painéis, vídeo-tapes, televisão, cinema, programa para rádio, entre outros); (III) criação de web site, divulgação em rede mundial de computadores (internet) e redes sociais; (IV) criação de banco de dados; (V) para qualquer outro tipo de publicação.

Por esta ser a expressão da minha vontade, declaro que autorizo o uso acima descrito sem que nada haja a ser reclamado a título de direitos conexos à minha imagem ou a qualquer outro.

Data: ${new Date().toLocaleDateString('pt-BR')}
Assinatura Digital: ${formData.name || '[NOME]'}`

    setTermsText(terms)
  }

  // Atualizar termo quando dados mudarem
  useEffect(() => {
    generateTermsText()
  }, [formData.name, formData.email, formData.phone])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', '1')
        .single()

      if (data) {
        setSettings(data)
        setTempSettings(data)
      }
    } catch (error) {
      console.log('Configurações não encontradas, usando padrão')
    }
  }

  const saveSettings = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: '1',
          whatsapp_group_link: tempSettings.whatsapp_group_link,
          event_name: tempSettings.event_name,
          event_date: tempSettings.event_date,
          event_location: tempSettings.event_location,
          event_address: tempSettings.event_address
        })

      if (!error) {
        setSettings(tempSettings)
        setSettingsOpen(false)
        alert('Configurações salvas com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações')
    }
  }

  // Carregar convidados para admin
  const loadGuests = async () => {
    setIsLoadingAdmin(true)
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro do Supabase:', error)
        throw error
      }
      setGuests(data || [])
    } catch (error) {
      console.error('Erro ao carregar convidados:', error)
      alert('Erro ao carregar convidados. Verifique a conexão.')
    } finally {
      setIsLoadingAdmin(false)
    }
  }

  // Gerar QR Code
  const generateQRCode = async (guestData: any) => {
    try {
      const qrData = JSON.stringify({
        id: guestData.id,
        name: guestData.name,
        email: guestData.email,
        event: eventInfo.title,
        date: eventInfo.date,
        timestamp: new Date().toISOString()
      })
      
      return await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
      return null
    }
  }

  // Enviar email com QR Code
  const sendEmailWithQRCode = async (guest: Guest, qrCode: string) => {
    try {
      setIsSendingEmail(true)
      
      // Converter QR Code para base64 (remover prefixo data:image/png;base64,)
      const qrCodeBase64 = qrCode.replace(/^data:image\/png;base64,/, '')
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: guest.email,
          name: guest.name,
          qrCodeImage: qrCodeBase64,
          qrCodeData: JSON.stringify({
            id: guest.id,
            name: guest.name,
            email: guest.email,
            event: eventInfo.title,
            date: eventInfo.date
          })
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar email')
      }

      console.log('Email enviado com sucesso:', result)
      return true
    } catch (error) {
      console.error('Erro ao enviar email:', error)
      alert(`Erro ao enviar email para ${guest.email}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      return false
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Validar telefone
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11)
    
    // Aplica máscara
    if (limited.length <= 2) {
      return `(${limited}`
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
    }
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validações
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!formData.email.trim()) {
        throw new Error('Email é obrigatório')
      }
      if (!formData.phone.trim()) {
        throw new Error('Telefone é obrigatório')
      }
      if (!formData.accepted_terms) {
        throw new Error('É necessário aceitar o termo de uso de imagem')
      }

      const { data, error } = await supabase
        .from('guests')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          instagram: formData.instagram.trim() || '',
          has_companion: formData.has_companion,
          accepted_terms: formData.accepted_terms,
          status: 'pending',
          checked_in: false,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Erro detalhado do Supabase:', error)
        throw new Error(`Erro ao salvar: ${error.message}`)
      }

      console.log('Inscrição salva com sucesso:', data)
      setCurrentScreen('success')
    } catch (error: any) {
      console.error('Erro ao salvar inscrição:', error)
      alert(error.message || 'Erro ao confirmar presença. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Autenticação admin
  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true)
      loadGuests()
    } else {
      alert('Senha incorreta')
    }
  }

  // Autenticação check-in
  const handleCheckinLogin = () => {
    if (checkinPassword === 'checkin123') {
      setIsCheckinAuthenticated(true)
      loadGuests()
    } else {
      alert('Senha incorreta')
    }
  }

  // Aprovar convidado
  const approveGuest = async (guestId: string) => {
    try {
      const guest = guests.find(g => g.id === guestId)
      if (!guest) return

      const qrCode = await generateQRCode(guest)
      
      const { error } = await supabase
        .from('guests')
        .update({ 
          status: 'approved',
          qr_code: qrCode
        })
        .eq('id', guestId)

      if (error) throw error
      
      // Enviar email com QR Code
      if (qrCode) {
        const emailSent = await sendEmailWithQRCode(guest, qrCode)
        if (emailSent) {
          alert(`Convidado aprovado! Email enviado para ${guest.email}`)
        } else {
          alert(`Convidado aprovado, mas houve erro no envio do email para ${guest.email}`)
        }
      }
      
      loadGuests()
    } catch (error) {
      console.error('Erro ao aprovar convidado:', error)
      alert('Erro ao aprovar convidado')
    }
  }

  // Rejeitar convidado
  const rejectGuest = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ status: 'rejected' })
        .eq('id', guestId)

      if (error) throw error
      loadGuests()
    } catch (error) {
      console.error('Erro ao rejeitar convidado:', error)
      alert('Erro ao rejeitar convidado')
    }
  }

  // Fazer check-in
  const checkInGuest = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({ 
          checked_in: true
        })
        .eq('id', guestId)

      if (error) throw error
      loadGuests()
      alert('Check-in realizado com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer check-in:', error)
      alert('Erro ao fazer check-in')
    }
  }

  // Iniciar scanner de câmera
  const startCameraScanner = async () => {
    if (!videoRef.current) return

    try {
      setCameraError('')
      setIsCameraActive(true)

      // Verificar se QrScanner está disponível
      if (!QrScanner.hasCamera()) {
        throw new Error('Nenhuma câmera encontrada no dispositivo')
      }

      // Criar nova instância do scanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detectado:', result.data)
          
          // Evitar processar o mesmo código repetidamente
          if (result.data !== lastScannedCode) {
            setLastScannedCode(result.data)
            processQRCode(result.data)
            stopCameraScanner()
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Câmera traseira
          maxScansPerSecond: 5,
        }
      )

      await qrScannerRef.current.start()
      console.log('Scanner de câmera iniciado')
      
    } catch (error) {
      console.error('Erro ao iniciar câmera:', error)
      setCameraError(error instanceof Error ? error.message : 'Erro ao acessar câmera')
      setIsCameraActive(false)
    }
  }

  // Parar scanner de câmera
  const stopCameraScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setIsCameraActive(false)
    setCameraError('')
  }

  // Processar QR Code escaneado
  const processQRCode = async (qrData: string) => {
    try {
      // Tentar parsear como JSON
      let guestData
      try {
        guestData = JSON.parse(qrData)
      } catch {
        // Se não for JSON, tratar como ID simples
        guestData = { id: qrData }
      }

      if (!guestData.id) {
        throw new Error('QR Code inválido - ID não encontrado')
      }

      // Buscar convidado no banco
      const guest = guests.find(g => g.id === guestData.id)
      if (!guest) {
        throw new Error('Convidado não encontrado')
      }

      if (guest.status !== 'approved') {
        throw new Error('Convidado não aprovado')
      }

      if (guest.checked_in) {
        throw new Error('Check-in já realizado anteriormente')
      }

      // Realizar check-in
      await checkInGuest(guest.id)
      setQrScanInput('')
      
    } catch (error) {
      console.error('Erro ao processar QR Code:', error)
      alert(error instanceof Error ? error.message : 'Erro ao processar QR Code')
    }
  }

  // Adicionar convidado manualmente
  const addGuestManually = async () => {
    if (!newGuestName || !newGuestEmail) return

    setIsAddingGuest(true)
    try {
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          name: newGuestName,
          email: newGuestEmail,
          phone: '',
          instagram: '',
          has_companion: false,
          accepted_terms: true,
          status: 'approved',
          checked_in: false,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      const qrCode = await generateQRCode(data)
      
      await supabase
        .from('guests')
        .update({ qr_code: qrCode })
        .eq('id', data.id)

      setNewGuestName('')
      setNewGuestEmail('')
      loadGuests()
      alert('Convidado adicionado com sucesso!')
    } catch (error) {
      console.error('Erro ao adicionar convidado:', error)
      alert('Erro ao adicionar convidado')
    } finally {
      setIsAddingGuest(false)
    }
  }

  // Compartilhar no WhatsApp
  const shareOnWhatsApp = () => {
    const message = `🎉 Confirmei minha presença na ${eventInfo.title}!

📅 ${eventInfo.date}
📍 ${eventInfo.location}

Vai ser incrível! 🎵`
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  // Tela de Boas-Vindas
  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 text-gray-900">
        {/* Header com logo */}
        <div className="px-4 py-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50 inline-block">
                <img 
                  src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/98994b5a-f06b-4620-b068-34feb814a40f.png" 
                  alt="Logo Apaixonado Como Nunca" 
                  className="h-80 sm:h-96 md:h-[28rem] lg:h-[32rem] w-auto mx-auto drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Evento */}
        <div className="px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xl sm:text-2xl text-gray-900">{eventInfo.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
                      <MapPin className="w-6 h-6 text-white mt-1" />
                    </div>
                    <div>
                      <p className="font-bold text-lg sm:text-xl mb-2 text-gray-900">{eventInfo.location}</p>
                      <p className="text-gray-600 text-sm sm:text-base">{eventInfo.address}</p>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200 my-6"></div>

                  <div className="text-center space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200/50">
                      <p className="text-gray-800 text-lg sm:text-xl font-semibold mb-3 leading-relaxed">
                        Vai ser lindo ter você com a gente no EP GL APAIXONADO COMO NUNCA!
                      </p>
                      <p className="text-gray-600 text-base sm:text-lg">
                        Clique no botão abaixo para confirmar sua presença.
                      </p>
                    </div>

                    <Button 
                      onClick={() => setCurrentScreen('form')}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 sm:px-12 py-6 sm:py-7 text-lg sm:text-xl rounded-lg w-full sm:w-auto shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform active:scale-95"
                    >
                      <Users className="w-6 h-6 mr-3" />
                      Confirmar Presença
                    </Button>

                    {settings.whatsapp_group_link && (
                      <Button 
                        onClick={() => window.open(settings.whatsapp_group_link!, '_blank')}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <MessageCircle className="w-6 h-6 mr-3" />
                        Grupo Oficial
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer com contatos e admin */}
        <div className="px-4 py-8 border-t border-gray-200/50">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600 mb-6 text-lg">Contato e Suporte</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm sm:text-base mb-6">
              <a href={`https://wa.me/5511996359550`} className="flex items-center gap-3 text-gray-700 hover:text-gray-900 justify-center transition-all duration-300 hover:scale-105">
                <Phone className="w-5 h-5" />
                <span className="font-semibold">{eventInfo.whatsapp}</span>
              </a>
              <a href={`mailto:${eventInfo.email}`} className="flex items-center gap-3 text-gray-700 hover:text-gray-900 justify-center transition-all duration-300 hover:scale-105">
                <Mail className="w-5 h-5" />
                <span className="font-semibold">{eventInfo.email}</span>
              </a>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setCurrentScreen('admin')}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-4 h-4 mr-2" />
                Painel Admin
              </Button>
              
              <Button 
                onClick={() => setCurrentScreen('checkin')}
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-900 border-blue-200 hover:bg-blue-50"
              >
                <Scan className="w-4 h-4 mr-2" />
                Check-in Portaria
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formulário de Confirmação
  if (currentScreen === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 text-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário */}
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-900 flex items-center justify-center gap-3">
                  <UserPlus className="w-7 h-7 text-purple-600" />
                  Confirmação de Presença
                </CardTitle>
                <p className="text-gray-600 mt-2">Preencha os dados abaixo para confirmar sua presença</p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dados Pessoais</h3>
                    
                    <div>
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="mt-1"
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="mt-1"
                          placeholder="seu@email.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                          required
                          className="mt-1"
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="instagram"
                          type="text"
                          value={formData.instagram}
                          onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                          className="mt-1 pl-10"
                          placeholder="@seuusuario"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informações Adicionais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informações Adicionais</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_companion"
                        checked={formData.has_companion}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_companion: checked as boolean }))}
                      />
                      <Label htmlFor="has_companion" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Vou levar acompanhante
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="accepted_terms"
                        checked={formData.accepted_terms}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accepted_terms: checked as boolean }))}
                        required
                      />
                      <Label htmlFor="accepted_terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Autorizo o uso da minha imagem para divulgação do evento *
                      </Label>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentScreen('welcome')}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.accepted_terms}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Presença
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Termo de Uso */}
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  Termo de Autorização de Uso de Imagem
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {termsText}
                  </pre>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">
                    <strong>Importante:</strong> Este termo será preenchido automaticamente com seus dados quando você completar o formulário ao lado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Sucesso
  if (currentScreen === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 text-gray-900 p-4 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur-sm border border-green-200/50 shadow-xl max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">
              Presença Confirmada!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-semibold mb-2">
                Obrigado, {formData.name}!
              </p>
              <p className="text-green-700 text-sm">
                Sua confirmação está <strong>pendente de aprovação</strong>. Você receberá um email com o QR Code após a aprovação.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={shareOnWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar no WhatsApp
              </Button>

              {settings.whatsapp_group_link && (
                <Button 
                  onClick={() => window.open(settings.whatsapp_group_link!, '_blank')}
                  variant="outline"
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Acessar Grupo Oficial
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  setCurrentScreen('welcome')
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    instagram: '',
                    has_companion: false,
                    accepted_terms: false
                  })
                }}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Painel Check-in (Portaria)
  if (currentScreen === 'checkin') {
    if (!isCheckinAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-900 p-4 flex items-center justify-center">
          <Card className="bg-white/90 backdrop-blur-sm border border-blue-200/50 shadow-xl max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 flex items-center justify-center gap-3">
                <Scan className="w-7 h-7 text-blue-600" />
                Check-in Portaria
              </CardTitle>
              <p className="text-gray-600 mt-2">Acesso para equipe da portaria</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="checkin-password">Senha de Check-in</Label>
                <Input
                  id="checkin-password"
                  type="password"
                  value={checkinPassword}
                  onChange={(e) => setCheckinPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Digite a senha"
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckinLogin()}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentScreen('welcome')}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                
                <Button
                  onClick={handleCheckinLogin}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm border border-blue-200/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                  <Scan className="w-7 h-7 text-blue-600" />
                  Check-in Portaria
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={loadGuests}
                    variant="outline"
                    size="sm"
                  >
                    Atualizar Lista
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentScreen('welcome')
                      setIsCheckinAuthenticated(false)
                      setCheckinPassword('')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingAdmin ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Carregando convidados...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Scanner de QR Code com Câmera */}
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Scanner de QR Code - Câmera
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Controles da Câmera */}
                        <div className="flex gap-2">
                          {!isCameraActive ? (
                            <Button
                              onClick={startCameraScanner}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Iniciar Câmera
                            </Button>
                          ) : (
                            <Button
                              onClick={stopCameraScanner}
                              variant="destructive"
                            >
                              <CameraOff className="w-4 h-4 mr-2" />
                              Parar Câmera
                            </Button>
                          )}
                        </div>

                        {/* Área da Câmera */}
                        {isCameraActive && (
                          <div className="relative">
                            <video
                              ref={videoRef}
                              className="w-full max-w-md mx-auto rounded-lg border-2 border-blue-300 shadow-lg"
                              style={{ aspectRatio: '1/1' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="border-2 border-green-400 bg-green-400/20 rounded-lg w-48 h-48 flex items-center justify-center">
                                <QrCode className="w-8 h-8 text-green-600" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Erro da Câmera */}
                        {cameraError && (
                          <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              <strong>Erro na câmera:</strong> {cameraError}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Scanner Manual (Fallback) */}
                        <div className="border-t pt-4">
                          <Label htmlFor="qr-input">Ou cole/digite o código manualmente:</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id="qr-input"
                              value={qrScanInput}
                              onChange={(e) => setQrScanInput(e.target.value)}
                              placeholder="Cole aqui o conteúdo do QR Code ou ID do convidado"
                              className="flex-1"
                            />
                            <Button
                              onClick={() => processQRCode(qrScanInput)}
                              disabled={!qrScanInput.trim()}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Scan className="w-4 h-4 mr-2" />
                              Processar
                            </Button>
                          </div>
                        </div>

                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Como usar:</strong> Clique em "Iniciar Câmera" e aponte para o QR Code do convidado. O check-in será feito automaticamente quando o código for detectado.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estatísticas Simplificadas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-800">
                          {guests.filter(g => g.status === 'approved').length}
                        </p>
                        <p className="text-green-700 text-sm">Aprovados</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <UserCheck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-800">
                          {guests.filter(g => g.checked_in).length}
                        </p>
                        <p className="text-purple-700 text-sm">Check-ins</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-800">
                          {guests.filter(g => g.status === 'approved' && !g.checked_in).length}
                        </p>
                        <p className="text-blue-700 text-sm">Pendentes</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de Convidados Aprovados */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Convidados Aprovados ({guests.filter(g => g.status === 'approved').length})
                    </h3>

                    <div className="space-y-3">
                      {guests.filter(g => g.status === 'approved').map((guest) => (
                        <Card key={guest.id} className={`border ${guest.checked_in ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h4 className="font-semibold text-gray-900">
                                    {guest.name}
                                  </h4>
                                  {guest.checked_in && (
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Check-in Realizado
                                    </Badge>
                                  )}
                                  {guest.has_companion && (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                      +1 Acompanhante
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                  <p><strong>Email:</strong> {guest.email}</p>
                                  <p><strong>Telefone:</strong> {guest.phone}</p>
                                  <p><strong>ID:</strong> {guest.id}</p>
                                  {guest.checked_in && (
                                    <p><strong>Check-in:</strong> {new Date(guest.created_at).toLocaleString('pt-BR')}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 ml-4">
                                {!guest.checked_in && (
                                  <Button
                                    onClick={() => checkInGuest(guest.id)}
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                  >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Check-in
                                  </Button>
                                )}

                                {guest.qr_code && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <QrCode className="w-4 h-4 mr-1" />
                                        QR Code
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>QR Code - {guest.name}</DialogTitle>
                                      </DialogHeader>
                                      <div className="text-center">
                                        <img 
                                          src={guest.qr_code} 
                                          alt="QR Code" 
                                          className="mx-auto mb-4 border rounded-lg"
                                        />
                                        <p className="text-sm text-gray-600 mb-2">
                                          QR Code para acesso ao evento
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
                                          ID: {guest.id}
                                        </p>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {guests.filter(g => g.status === 'approved').length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum convidado aprovado encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Painel Admin
  if (currentScreen === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 p-4 flex items-center justify-center">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 flex items-center justify-center gap-3">
                <Settings className="w-7 h-7" />
                Painel Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="admin-password">Senha de Administrador</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Digite a senha"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentScreen('welcome')}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                
                <Button
                  onClick={handleAdminLogin}
                  className="flex-1 bg-gray-900 hover:bg-gray-800"
                >
                  Entrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                  <Settings className="w-7 h-7" />
                  Painel Administrativo
                </CardTitle>
                <div className="flex gap-2">
                  <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações do App
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl">Configurações Completas do Sistema</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Configurações do Evento */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Calendar className="w-5 h-5" />
                              Informações do Evento
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="event-name">Nome do Evento</Label>
                              <Input
                                id="event-name"
                                value={tempSettings.event_name}
                                onChange={(e) => setTempSettings(prev => ({ ...prev, event_name: e.target.value }))}
                                className="mt-1"
                                placeholder="Nome completo do evento"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="event-date">Data e Horário</Label>
                                <Input
                                  id="event-date"
                                  value={tempSettings.event_date}
                                  onChange={(e) => setTempSettings(prev => ({ ...prev, event_date: e.target.value }))}
                                  className="mt-1"
                                  placeholder="Ex: 09/10 às 15h"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="event-location">Local do Evento</Label>
                                <Input
                                  id="event-location"
                                  value={tempSettings.event_location}
                                  onChange={(e) => setTempSettings(prev => ({ ...prev, event_location: e.target.value }))}
                                  className="mt-1"
                                  placeholder="Nome do local"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="event-address">Endereço Completo</Label>
                              <Textarea
                                id="event-address"
                                value={tempSettings.event_address}
                                onChange={(e) => setTempSettings(prev => ({ ...prev, event_address: e.target.value }))}
                                className="mt-1"
                                rows={3}
                                placeholder="Endereço completo com CEP"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Configurações de Comunicação */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <MessageCircle className="w-5 h-5" />
                              Comunicação e Contatos
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="group-link">Link do Grupo WhatsApp</Label>
                              <Input
                                id="group-link"
                                value={tempSettings.whatsapp_group_link || ''}
                                onChange={(e) => setTempSettings(prev => ({ ...prev, whatsapp_group_link: e.target.value }))}
                                placeholder="https://chat.whatsapp.com/..."
                                className="mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Este link aparecerá nos botões "Grupo Oficial"
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Telefone de Contato</Label>
                                <Input
                                  value="(11) 99635-9550"
                                  disabled
                                  className="mt-1 bg-gray-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Configurado no código (eventInfo.whatsapp)
                                </p>
                              </div>
                              
                              <div>
                                <Label>Email de Contato</Label>
                                <Input
                                  value="contato@escalamusic.com.br"
                                  disabled
                                  className="mt-1 bg-gray-50"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Configurado no código (eventInfo.email)
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Configurações de Email */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Mail className="w-5 h-5" />
                              Configurações de Email
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Status do Email:</strong> {process.env.RESEND_API_KEY ? '✅ Configurado' : '❌ Não configurado'}
                              </AlertDescription>
                            </Alert>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Provedor de Email</Label>
                                <Input
                                  value="Resend"
                                  disabled
                                  className="mt-1 bg-gray-50"
                                />
                              </div>
                              
                              <div>
                                <Label>Email Remetente</Label>
                                <Input
                                  value="EscalaMusic <noreply@escalamusic.com.br>"
                                  disabled
                                  className="mt-1 bg-gray-50"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label>API Key do Resend</Label>
                              <Input
                                value={process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 8)}...` : 'Não configurada'}
                                disabled
                                className="mt-1 bg-gray-50"
                                type="password"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Configurada nas variáveis de ambiente (.env.local)
                              </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h4 className="font-semibold text-blue-900 mb-2">Como configurar o email:</h4>
                              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Acesse <a href="https://resend.com" target="_blank" className="underline">resend.com</a> e crie uma conta</li>
                                <li>Gere uma API Key no dashboard</li>
                                <li>Adicione a chave no arquivo .env.local: RESEND_API_KEY="sua_chave_aqui"</li>
                                <li>Reinicie o servidor para aplicar as mudanças</li>
                              </ol>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Configurações do Sistema */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Shield className="w-5 h-5" />
                              Configurações do Sistema
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Senha Admin</Label>
                                <Input
                                  value="admin123"
                                  disabled
                                  className="mt-1 bg-gray-50"
                                  type="password"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Configurada no código (handleAdminLogin)
                                </p>
                              </div>
                              
                              <div>
                                <Label>Senha Check-in</Label>
                                <Input
                                  value="checkin123"
                                  disabled
                                  className="mt-1 bg-gray-50"
                                  type="password"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Configurada no código (handleCheckinLogin)
                                </p>
                              </div>
                            </div>

                            <div>
                              <Label>Banco de Dados</Label>
                              <Input
                                value={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Supabase - Conectado' : 'Não configurado'}
                                disabled
                                className="mt-1 bg-gray-50"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                                  `URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}` : 
                                  'Configure NEXT_PUBLIC_SUPABASE_URL no .env.local'
                                }
                              </p>
                            </div>

                            <div>
                              <Label>Ambiente</Label>
                              <Input
                                value={process.env.NODE_ENV || 'development'}
                                disabled
                                className="mt-1 bg-gray-50"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Ambiente atual de execução
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Estatísticas do App */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Estatísticas do Sistema
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{guests.length}</p>
                                <p className="text-sm text-blue-700">Total Inscritos</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{guests.filter(g => g.status === 'approved').length}</p>
                                <p className="text-sm text-green-700">Aprovados</p>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <p className="text-2xl font-bold text-yellow-600">{guests.filter(g => g.status === 'pending').length}</p>
                                <p className="text-sm text-yellow-700">Pendentes</p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <p className="text-2xl font-bold text-purple-600">{guests.filter(g => g.checked_in).length}</p>
                                <p className="text-sm text-purple-700">Check-ins</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={saveSettings} className="flex-1 bg-green-600 hover:bg-green-700">
                          <Send className="w-4 h-4 mr-2" />
                          Salvar Configurações do Evento
                        </Button>
                        <Button variant="outline" onClick={() => setSettingsOpen(false)} className="flex-1">
                          Cancelar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={() => {
                      setCurrentScreen('welcome')
                      setIsAdminAuthenticated(false)
                      setAdminPassword('')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingAdmin ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-600">Carregando convidados...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-800">
                          {guests.length}
                        </p>
                        <p className="text-blue-700 text-sm">Total</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4 text-center">
                        <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-yellow-800">
                          {guests.filter(g => g.status === 'pending').length}
                        </p>
                        <p className="text-yellow-700 text-sm">Pendentes</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-800">
                          {guests.filter(g => g.status === 'approved').length}
                        </p>
                        <p className="text-green-700 text-sm">Aprovados</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <UserCheck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-800">
                          {guests.filter(g => g.checked_in).length}
                        </p>
                        <p className="text-purple-700 text-sm">Check-ins</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Status do Email */}
                  {isSendingEmail && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Enviando email com QR Code...
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Adicionar Convidado */}
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Adicionar Convidado Manualmente
                      </h3>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Label htmlFor="new-guest-name">Nome</Label>
                          <Input
                            id="new-guest-name"
                            value={newGuestName}
                            onChange={(e) => setNewGuestName(e.target.value)}
                            placeholder="Nome completo"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="new-guest-email">Email</Label>
                          <Input
                            id="new-guest-email"
                            type="email"
                            value={newGuestEmail}
                            onChange={(e) => setNewGuestEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={addGuestManually}
                          disabled={isAddingGuest || !newGuestName || !newGuestEmail}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isAddingGuest ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Convidados */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Convidados ({guests.length})
                      </h3>
                      <Button
                        onClick={loadGuests}
                        variant="outline"
                        size="sm"
                      >
                        Atualizar
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {guests.map((guest) => (
                        <Card key={guest.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h4 className="font-semibold text-gray-900">
                                    {guest.name}
                                  </h4>
                                  <Badge variant={
                                    guest.status === 'approved' ? 'default' :
                                    guest.status === 'pending' ? 'secondary' : 'destructive'
                                  }>
                                    {guest.status === 'approved' ? 'Aprovado' :
                                     guest.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                  </Badge>
                                  {guest.checked_in && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Check-in
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                  <p><strong>Email:</strong> {guest.email}</p>
                                  <p><strong>Telefone:</strong> {guest.phone}</p>
                                  {guest.instagram && (
                                    <p><strong>Instagram:</strong> {guest.instagram}</p>
                                  )}
                                  <p><strong>Acompanhante:</strong> {guest.has_companion ? 'Sim' : 'Não'}</p>
                                  <p><strong>Termo de imagem:</strong> {guest.accepted_terms ? 'Aceito' : 'Não aceito'}</p>
                                  <p><strong>Data:</strong> {new Date(guest.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 ml-4">
                                {guest.status === 'pending' && (
                                  <>
                                    <Button
                                      onClick={() => approveGuest(guest.id)}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      disabled={isSendingEmail}
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Aprovar
                                    </Button>
                                    <Button
                                      onClick={() => rejectGuest(guest.id)}
                                      size="sm"
                                      variant="destructive"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Rejeitar
                                    </Button>
                                  </>
                                )}
                                
                                {guest.status === 'approved' && !guest.checked_in && (
                                  <Button
                                    onClick={() => checkInGuest(guest.id)}
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                  >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Check-in
                                  </Button>
                                )}

                                {guest.qr_code && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Eye className="w-4 h-4 mr-1" />
                                        QR Code
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>QR Code - {guest.name}</DialogTitle>
                                      </DialogHeader>
                                      <div className="text-center">
                                        <img 
                                          src={guest.qr_code} 
                                          alt="QR Code" 
                                          className="mx-auto mb-4 border rounded-lg"
                                        />
                                        <p className="text-sm text-gray-600">
                                          QR Code para acesso ao evento
                                        </p>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {guests.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum convidado encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}