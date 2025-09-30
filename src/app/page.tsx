'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Music, MapPin, Calendar, Clock, Users, Share2, ExternalLink, Navigation, QrCode, Settings, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { createGuest, getGuestByEmail, generateQRCode } from '@/lib/supabase'

interface Companion {
  name: string
  email?: string
}

export default function HomePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    imageConsent: false,
    hasCompanion: false,
    companionCount: 0,
    companions: [] as Companion[]
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showQRCheck, setShowQRCheck] = useState(false)
  const [checkEmail, setCheckEmail] = useState('')
  const [guestStatus, setGuestStatus] = useState<any>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Auto-fill term when form data changes
  const filledTerm = `TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM

Eu, ${formData.name || '[NOME]'}, portador(a) do e-mail ${formData.email || '[EMAIL]'} e telefone ${formData.phone || '[TELEFONE]'}, AUTORIZO de forma gratuita e por prazo indeterminado, o uso da minha imagem em fotos e/ou vídeos, para fins de divulgação do evento "Gravação do EP "Apaixonado Como Nunca"" realizado em 09/10 às 15h no local Prainha Natal – ao lado do Hotel Imirá.

A presente autorização é concedida a título gratuito, abrangendo o uso da imagem acima mencionada em todo território nacional e no exterior, em todas as suas modalidades e, em destaque, das seguintes formas: (I) outdoor, cartazes, folhetos em geral (encartes, mala direta, catálogo, etc.); (II) mídia eletrônica (painéis, vídeo-tapes, televisão, cinema, programa para rádio, entre outros); (III) criação de web site, divulgação em rede mundial de computadores (internet) e redes sociais; (IV) criação de banco de dados; (V) para qualquer outro tipo de publicação.

Por esta ser a expressão da minha vontade, declaro que autorizo o uso acima descrito sem que nada haja a ser reclamado a título de direitos conexos à minha imagem ou a qualquer outro.

Data: 29/09/2025
Assinatura Digital: ${formData.name || '[NOME]'}

Importante: Este termo será preenchido automaticamente com seus dados quando você completar o formulário ao lado.`

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCompanionCountChange = (count: number) => {
    const companions = Array.from({ length: count }, (_, i) => 
      formData.companions[i] || { name: '', email: '' }
    )
    setFormData(prev => ({ 
      ...prev, 
      companionCount: count,
      companions 
    }))
  }

  const handleCompanionChange = (index: number, field: string, value: string) => {
    const newCompanions = [...formData.companions]
    newCompanions[index] = { ...newCompanions[index], [field]: value }
    setFormData(prev => ({ ...prev, companions: newCompanions }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (!formData.imageConsent) {
      toast.error('É necessário aceitar o termo de uso de imagem')
      return
    }

    if (formData.hasCompanion && formData.companions.some(c => !c.name)) {
      toast.error('Por favor, preencha o nome de todos os acompanhantes')
      return
    }

    setIsSubmitting(true)

    try {
      // Check if guest already exists
      const existingGuest = await getGuestByEmail(formData.email)
      if (existingGuest) {
        toast.error('Este e-mail já está cadastrado!')
        setIsSubmitting(false)
        return
      }

      // Create guest - apenas com campos básicos que existem na tabela
      const guestData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        instagram: formData.instagram || undefined,
        has_companion: formData.hasCompanion,
        image_consent: formData.imageConsent,
        status: 'pending' as const,
        checked_in: false
      }

      await createGuest(guestData)
      
      toast.success('Inscrição realizada com sucesso! Aguarde a aprovação.')
      setShowForm(false)
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        instagram: '',
        imageConsent: false,
        hasCompanion: false,
        companionCount: 0,
        companions: []
      })
    } catch (error) {
      console.error('Erro ao enviar inscrição:', error?.message || error?.toString() || 'Erro desconhecido')
      toast.error('Erro ao enviar inscrição. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!checkEmail) {
      toast.error('Digite seu e-mail')
      return
    }

    setCheckingStatus(true)

    try {
      const guest = await getGuestByEmail(checkEmail)
      if (guest) {
        setGuestStatus(guest)
      } else {
        toast.error('E-mail não encontrado. Verifique se você já se inscreveu.')
        setGuestStatus(null)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      toast.error('Erro ao verificar status. Tente novamente.')
    } finally {
      setCheckingStatus(false)
    }
  }

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `🎵 Você é nosso convidado especial! 🎵\n\nGravação do EP "Apaixonado Como Nunca"\n📅 09 de Outubro às 15h\n📍 Prainha Via Costeira–Natal/RN\n\nConfirme sua presença: ${window.location.href}`
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const openInWaze = () => {
    window.open('https://waze.com/ul/hsv8ufqd5k', '_blank')
  }

  const openInGoogleMaps = () => {
    window.open('https://maps.google.com/?q=Prainha+Natal+Via+Costeira', '_blank')
  }

  const openOfficialGroup = () => {
    window.open('https://chat.whatsapp.com/grupo-oficial', '_blank')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✅ Aprovado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendente</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejeitado</Badge>
      default:
        return <Badge variant="secondary">Status desconhecido</Badge>
    }
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 p-4">
        <div className="max-w-6xl mx-auto">
          <Button 
            onClick={() => setShowForm(false)}
            variant="ghost" 
            className="text-white mb-4 hover:bg-white/10"
          >
            ← Voltar
          </Button>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form Column */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl text-purple-900 flex items-center gap-2">
                  <Users className="w-5 h-5 md:w-6 md:h-6" />
                  Confirme sua Presença
                </CardTitle>
                <CardDescription>
                  Preencha seus dados para garantir sua participação neste momento especial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(84) 99999-9999"
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instagram" className="text-sm font-medium">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="@seuinstagram"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="imageConsent"
                      checked={formData.imageConsent}
                      onCheckedChange={(checked) => handleInputChange('imageConsent', checked)}
                      className="mt-1"
                    />
                    <Label htmlFor="imageConsent" className="text-sm leading-relaxed">
                      Autorizo o uso da minha imagem para divulgação do evento *
                    </Label>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="hasCompanion"
                      checked={formData.hasCompanion}
                      onCheckedChange={(checked) => {
                        handleInputChange('hasCompanion', checked)
                        if (!checked) {
                          handleInputChange('companionCount', 0)
                          handleInputChange('companions', [])
                        }
                      }}
                      className="mt-1"
                    />
                    <Label htmlFor="hasCompanion" className="text-sm">
                      Vou levar acompanhante(s)
                    </Label>
                  </div>

                  {formData.hasCompanion && (
                    <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                      <div>
                        <Label htmlFor="companionCount" className="text-sm font-medium">Quantos acompanhantes?</Label>
                        <select
                          id="companionCount"
                          value={formData.companionCount}
                          onChange={(e) => handleCompanionCountChange(Number(e.target.value))}
                          className="w-full p-2 border rounded-md mt-1"
                        >
                          <option value={0}>Selecione</option>
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>

                      {formData.companions.map((companion, index) => (
                        <div key={index} className="space-y-2">
                          <Label className="text-sm font-medium">Acompanhante {index + 1}</Label>
                          <Input
                            placeholder="Nome completo"
                            value={companion.name}
                            onChange={(e) => handleCompanionChange(index, 'name', e.target.value)}
                            required
                          />
                          <Input
                            placeholder="E-mail (opcional)"
                            type="email"
                            value={companion.email || ''}
                            onChange={(e) => handleCompanionChange(index, 'email', e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 font-semibold"
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar Presença'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Term Column */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl text-gray-800">TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM</CardTitle>
                <CardDescription>
                  Este termo será preenchido automaticamente com seus dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 space-y-3 leading-relaxed max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">{filledTerm}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (showQRCheck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 p-4">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={() => {
              setShowQRCheck(false)
              setGuestStatus(null)
              setCheckEmail('')
            }}
            variant="ghost" 
            className="text-white mb-4 hover:bg-white/10"
          >
            ← Voltar
          </Button>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl text-purple-900 flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 md:w-6 md:h-6" />
                Verificar Status
              </CardTitle>
              <CardDescription>
                Digite seu e-mail para verificar o status da sua inscrição
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!guestStatus ? (
                <form onSubmit={handleCheckStatus} className="space-y-4">
                  <Input
                    type="email"
                    value={checkEmail}
                    onChange={(e) => setCheckEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="text-center"
                    required
                  />
                  <Button 
                    type="submit"
                    disabled={checkingStatus}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {checkingStatus ? 'Verificando...' : 'Verificar Status'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{guestStatus.name}</h3>
                    {getStatusBadge(guestStatus.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>E-mail:</strong> {guestStatus.email}</p>
                    <p><strong>Telefone:</strong> {guestStatus.phone}</p>
                    {guestStatus.has_companion && (
                      <p><strong>Tem acompanhante:</strong> Sim</p>
                    )}
                    <p><strong>Inscrito em:</strong> {new Date(guestStatus.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>

                  {guestStatus.status === 'approved' && guestStatus.qr_code && (
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">🎫 Seu QR Code</h4>
                      <div className="font-mono text-sm bg-white p-3 rounded border">
                        {guestStatus.qr_code}
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Apresente este código na entrada do evento
                      </p>
                    </div>
                  )}

                  {guestStatus.status === 'pending' && (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-yellow-800">
                        Sua inscrição está sendo analisada. Você receberá um e-mail quando for aprovada.
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={() => {
                      setGuestStatus(null)
                      setCheckEmail('')
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Verificar Outro E-mail
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Access - Hidden but accessible */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link href="/admin">
          <Button size="sm" variant="ghost" className="opacity-20 hover:opacity-100 transition-opacity">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/checkin">
          <Button size="sm" variant="ghost" className="opacity-20 hover:opacity-100 transition-opacity">
            <UserCheck className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="w-full h-48 sm:h-64 md:h-80 lg:h-96 relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-red-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">EP Apaixonado Como Nunca</h1>
            <p className="text-lg sm:text-xl opacity-90">Gabriel Lima</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Event Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-800">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <span className="font-semibold text-lg">09/10 às 15h</span>
          </div>

          <div className="flex items-start gap-3 text-gray-800">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">Prainha Natal – ao lado do Hotel Imirá</div>
              <div className="text-sm text-gray-600 mt-1 break-words">
                Av. Senador Dinarte Mariz, Via Costeira, 4077 - B, Natal - RN, 59090-002
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={openInWaze}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-3 flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Abrir no Waze</span>
            </Button>
            <Button 
              onClick={openInGoogleMaps}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-3 flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Google Maps</span>
            </Button>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
          <p className="text-gray-800 text-center leading-relaxed">
            <span className="font-semibold">Vai ser lindo ter você com a gente no EP GL APAIXONADO COMO NUNCA!</span>
            <br />
            <br />
            Confirme sua presença ou verifique se já foi aprovado.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" />
            <span>Confirmar Presença</span>
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={() => setShowQRCheck(true)}
              variant="outline"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span className="text-center leading-tight">Já me inscrevi<br />Ver meu QR Code</span>
            </Button>
            
            <Button 
              onClick={openOfficialGroup}
              variant="outline"
              className="border-2 border-green-500 text-green-600 hover:bg-green-50 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Grupo Oficial</span>
            </Button>
          </div>

          <Button 
            onClick={shareOnWhatsApp}
            variant="outline"
            className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar Convite</span>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-2xl font-serif text-gray-800 mb-2">Gabriel Lima</p>
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 mx-auto"
            onClick={() => window.open('https://www.instagram.com/gabriellimacantorr', '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            <span>@gabriellimacantorr</span>
          </Button>
        </div>
      </div>
    </div>
  )
}