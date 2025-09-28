'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import { 
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  UserPlus, 
  Car, 
  Bus, 
  Plane,
  Settings,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Screen = 'welcome' | 'form' | 'success' | 'admin'

interface Confirmation {
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

interface FormData {
  name: string
  email: string
  phone: string
  companions: number
  dietary_restrictions: string
  transport: string
  accommodation: string
  special_requests: string
}

export default function EventApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    companions: 0,
    dietary_restrictions: '',
    transport: '',
    accommodation: '',
    special_requests: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmations, setConfirmations] = useState<Confirmation[]>([])
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  // Dados do evento
  const eventInfo = {
    title: 'Gravação do EP "Apaixonado Como Nunca"',
    date: '09/10 às 15h',
    location: 'Prainha Natal – ao lado do Hotel Imirá',
    address: 'Av. Senador Dinarte Mariz, Via Costeira, 4077 - B, Natal - RN, 59090-002',
    whatsapp: '(11) 99635-9550',
    email: 'contato@escalamusic.com.br'
  }

  // Carregar confirmações para admin
  const loadConfirmations = async () => {
    setIsLoadingAdmin(true)
    try {
      const { data, error } = await supabase
        .from('confirmations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setConfirmations(data || [])
    } catch (error) {
      console.error('Erro ao carregar confirmações:', error)
    } finally {
      setIsLoadingAdmin(false)
    }
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('confirmations')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          companions: formData.companions,
          dietary_restrictions: formData.dietary_restrictions || null,
          transport: formData.transport,
          accommodation: formData.accommodation || null,
          special_requests: formData.special_requests || null,
          status: 'confirmed'
        }])

      if (error) throw error

      setCurrentScreen('success')
    } catch (error) {
      console.error('Erro ao salvar confirmação:', error)
      alert('Erro ao confirmar presença. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gerar PDF da confirmação
  const generatePDF = async () => {
    const pdf = new jsPDF()
    
    // Título
    pdf.setFontSize(20)
    pdf.text('Confirmação de Presença', 20, 30)
    
    // Informações do evento
    pdf.setFontSize(16)
    pdf.text('Gravação do EP "Apaixonado Como Nunca"', 20, 50)
    
    pdf.setFontSize(12)
    pdf.text(`Data: ${eventInfo.date}`, 20, 70)
    pdf.text(`Local: ${eventInfo.location}`, 20, 80)
    pdf.text(`Endereço: ${eventInfo.address}`, 20, 90)
    
    // Dados do participante
    pdf.setFontSize(14)
    pdf.text('Dados do Participante:', 20, 110)
    
    pdf.setFontSize(12)
    pdf.text(`Nome: ${formData.name}`, 20, 125)
    pdf.text(`Email: ${formData.email}`, 20, 135)
    pdf.text(`Telefone: ${formData.phone}`, 20, 145)
    pdf.text(`Acompanhantes: ${formData.companions}`, 20, 155)
    pdf.text(`Transporte: ${formData.transport}`, 20, 165)
    
    if (formData.accommodation) {
      pdf.text(`Hospedagem: ${formData.accommodation}`, 20, 175)
    }
    
    // Gerar QR Code
    try {
      const qrCodeData = JSON.stringify({
        name: formData.name,
        email: formData.email,
        event: eventInfo.title,
        date: eventInfo.date
      })
      
      const qrCodeUrl = await QRCode.toDataURL(qrCodeData)
      pdf.addImage(qrCodeUrl, 'PNG', 150, 110, 40, 40)
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
    }
    
    pdf.save(`confirmacao-${formData.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  // Autenticação admin
  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true)
      loadConfirmations()
    } else {
      alert('Senha incorreta')
    }
  }

  // Atualizar status da confirmação
  const updateConfirmationStatus = async (id: string, status: 'confirmed' | 'pending' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('confirmations')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      
      setConfirmations(prev => 
        prev.map(conf => 
          conf.id === id ? { ...conf, status } : conf
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  // Tela de Boas-Vindas
  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900">
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
                    <div className="p-3 bg-gray-900 rounded-full shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xl sm:text-2xl text-gray-900">{eventInfo.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-gray-900 rounded-full shadow-lg">
                      <MapPin className="w-6 h-6 text-white mt-1" />
                    </div>
                    <div>
                      <p className="font-bold text-lg sm:text-xl mb-2 text-gray-900">{eventInfo.location}</p>
                      <p className="text-gray-600 text-sm sm:text-base">{eventInfo.address}</p>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200 my-6"></div>

                  <div className="text-center space-y-4">
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200/50">
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
                      className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 sm:px-12 py-6 sm:py-7 text-lg sm:text-xl rounded-lg w-full sm:w-auto shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform active:scale-95"
                    >
                      <Users className="w-6 h-6 mr-3" />
                      Confirmar Presença
                    </Button>
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
            
            <Button 
              onClick={() => setCurrentScreen('admin')}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-4 h-4 mr-2" />
              Painel Admin
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Formulário de Confirmação
  if (currentScreen === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900 flex items-center justify-center gap-3">
                <UserPlus className="w-7 h-7" />
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
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        className="mt-1"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="companions">Número de Acompanhantes</Label>
                    <Select value={formData.companions.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, companions: parseInt(value) }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Apenas eu</SelectItem>
                        <SelectItem value="1">1 acompanhante</SelectItem>
                        <SelectItem value="2">2 acompanhantes</SelectItem>
                        <SelectItem value="3">3 acompanhantes</SelectItem>
                        <SelectItem value="4">4 acompanhantes</SelectItem>
                        <SelectItem value="5">5+ acompanhantes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Logística */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Logística</h3>
                  
                  <div>
                    <Label htmlFor="transport">Como você vai chegar ao evento? *</Label>
                    <Select value={formData.transport} onValueChange={(value) => setFormData(prev => ({ ...prev, transport: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione seu meio de transporte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Carro próprio">
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            Carro próprio
                          </div>
                        </SelectItem>
                        <SelectItem value="Transporte público">
                          <div className="flex items-center gap-2">
                            <Bus className="w-4 h-4" />
                            Transporte público
                          </div>
                        </SelectItem>
                        <SelectItem value="Uber/Taxi">
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            Uber/Taxi
                          </div>
                        </SelectItem>
                        <SelectItem value="Avião">
                          <div className="flex items-center gap-2">
                            <Plane className="w-4 h-4" />
                            Avião
                          </div>
                        </SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="accommodation">Hospedagem (se aplicável)</Label>
                    <Input
                      id="accommodation"
                      type="text"
                      value={formData.accommodation}
                      onChange={(e) => setFormData(prev => ({ ...prev, accommodation: e.target.value }))}
                      className="mt-1"
                      placeholder="Nome do hotel ou local onde ficará"
                    />
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informações Adicionais</h3>
                  
                  <div>
                    <Label htmlFor="dietary_restrictions">Restrições Alimentares</Label>
                    <Textarea
                      id="dietary_restrictions"
                      value={formData.dietary_restrictions}
                      onChange={(e) => setFormData(prev => ({ ...prev, dietary_restrictions: e.target.value }))}
                      className="mt-1"
                      placeholder="Vegetariano, vegano, alergias, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="special_requests">Solicitações Especiais</Label>
                    <Textarea
                      id="special_requests"
                      value={formData.special_requests}
                      onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
                      className="mt-1"
                      placeholder="Alguma necessidade especial ou comentário"
                      rows={3}
                    />
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
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.transport}
                    className="flex-1 bg-gray-900 hover:bg-gray-800"
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
                Sua confirmação foi registrada com sucesso. Você receberá mais informações por email.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={generatePDF}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Comprovante PDF
              </Button>
              
              <Button 
                onClick={() => {
                  setCurrentScreen('welcome')
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    companions: 0,
                    dietary_restrictions: '',
                    transport: '',
                    accommodation: '',
                    special_requests: ''
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                  <Settings className="w-7 h-7" />
                  Painel Administrativo
                </CardTitle>
                <Button
                  onClick={() => {
                    setCurrentScreen('welcome')
                    setIsAdminAuthenticated(false)
                    setAdminPassword('')
                  }}
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingAdmin ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-600">Carregando confirmações...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-800">
                          {confirmations.filter(c => c.status === 'confirmed').length}
                        </p>
                        <p className="text-green-700 text-sm">Confirmados</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4 text-center">
                        <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-yellow-800">
                          {confirmations.filter(c => c.status === 'pending').length}
                        </p>
                        <p className="text-yellow-700 text-sm">Pendentes</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4 text-center">
                        <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-red-800">
                          {confirmations.filter(c => c.status === 'cancelled').length}
                        </p>
                        <p className="text-red-700 text-sm">Cancelados</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de Confirmações */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Confirmações ({confirmations.length})
                      </h3>
                      <Button
                        onClick={loadConfirmations}
                        variant="outline"
                        size="sm"
                      >
                        Atualizar
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {confirmations.map((confirmation) => (
                        <Card key={confirmation.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {confirmation.name}
                                  </h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    confirmation.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800'
                                      : confirmation.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {confirmation.status === 'confirmed' ? 'Confirmado' :
                                     confirmation.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                  <p><strong>Email:</strong> {confirmation.email}</p>
                                  <p><strong>Telefone:</strong> {confirmation.phone}</p>
                                  <p><strong>Acompanhantes:</strong> {confirmation.companions}</p>
                                  <p><strong>Transporte:</strong> {confirmation.transport}</p>
                                  {confirmation.accommodation && (
                                    <p><strong>Hospedagem:</strong> {confirmation.accommodation}</p>
                                  )}
                                  <p><strong>Data:</strong> {new Date(confirmation.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>

                                {confirmation.dietary_restrictions && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    <strong>Restrições:</strong> {confirmation.dietary_restrictions}
                                  </p>
                                )}

                                {confirmation.special_requests && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    <strong>Solicitações:</strong> {confirmation.special_requests}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2 ml-4">
                                <Select
                                  value={confirmation.status}
                                  onValueChange={(value: 'confirmed' | 'pending' | 'cancelled') => 
                                    updateConfirmationStatus(confirmation.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="confirmed">Confirmado</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {confirmations.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma confirmação encontrada</p>
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