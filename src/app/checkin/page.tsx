'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode, 
  Camera, 
  UserCheck, 
  Users, 
  Search, 
  CheckCircle, 
  XCircle,
  Home,
  Settings,
  Volume2,
  VolumeX,
  Scan
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { getGuests, updateGuest, getGuestByQRCode, type Guest } from '@/lib/supabase'

export default function CheckinPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [guests, setGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [scannerSupported, setScannerSupported] = useState(false)
  const [qrScanner, setQrScanner] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Verificar se o scanner é suportado e carregar dinamicamente
    const loadQrScanner = async () => {
      try {
        const QrScannerModule = await import('qr-scanner')
        const QrScanner = QrScannerModule.default
        
        const hasCamera = await QrScanner.hasCamera()
        setScannerSupported(hasCamera)
        
        if (hasCamera && videoRef.current) {
          const scanner = new QrScanner(
            videoRef.current,
            (result: any) => handleQRCodeDetected(result.data),
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment'
            }
          )
          setQrScanner(scanner)
        }
      } catch (error) {
        console.error('Erro ao carregar QR Scanner:', error)
        setScannerSupported(false)
      }
    }

    if (typeof window !== 'undefined') {
      loadQrScanner()
    }

    return () => {
      if (qrScanner) {
        qrScanner.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadGuests()
      // Refresh guests every 30 seconds
      const interval = setInterval(loadGuests, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const loadGuests = async () => {
    try {
      const data = await getGuests()
      setGuests(data?.filter(g => g.status === 'approved') || [])
    } catch (error) {
      console.error('Erro ao carregar convidados:', error)
    }
  }

  const playSuccessSound = () => {
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        console.log('Audio context not available')
      }
    }
  }

  const playErrorSound = () => {
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      } catch (error) {
        console.log('Audio context not available')
      }
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'checkin123') {
      setIsAuthenticated(true)
      toast.success('Login realizado com sucesso!')
    } else {
      toast.error('Senha incorreta!')
    }
  }

  const handleCheckin = async (guestId: string) => {
    setLoading(true)
    try {
      const guest = guests.find(g => g.id === guestId)
      if (!guest) {
        playErrorSound()
        toast.error('Convidado não encontrado!')
        return
      }

      if (guest.status !== 'approved') {
        playErrorSound()
        toast.error('Convidado não aprovado!')
        return
      }

      if (guest.checked_in) {
        playErrorSound()
        toast.error('Check-in já realizado!')
        return
      }

      await updateGuest(guestId, { 
        checked_in: true, 
        checked_in_at: new Date().toISOString() 
      })

      await loadGuests()

      playSuccessSound()
      const companionText = guest.has_companion ? ' + acompanhante(s)' : ''
      toast.success(`✅ Check-in realizado: ${guest.name}${companionText}`)
      
      // Clear manual code if used
      setManualCode('')
    } catch (error) {
      console.error('Erro ao realizar check-in:', error)
      playErrorSound()
      toast.error('Erro ao realizar check-in')
    } finally {
      setLoading(false)
    }
  }

  const handleQRCodeDetected = async (result: string) => {
    if (loading) return // Prevent multiple scans
    
    setLoading(true)
    try {
      const guest = await getGuestByQRCode(result.trim())
      if (guest) {
        await handleCheckin(guest.id)
      } else {
        playErrorSound()
        toast.error('Código QR inválido!')
      }
    } catch (error) {
      console.error('Erro ao processar QR Code:', error)
      playErrorSound()
      toast.error('Erro ao processar QR Code')
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) {
      toast.error('Digite o código QR')
      return
    }

    await handleQRCodeDetected(manualCode.trim())
  }

  const startScanner = async () => {
    try {
      if (!qrScanner) {
        toast.error('Scanner não disponível. Recarregue a página.')
        return
      }

      await qrScanner.start()
      setScannerActive(true)
      toast.success('Scanner ativo! Aponte para o QR Code do convidado.')
      
    } catch (error) {
      console.error('Erro ao iniciar scanner:', error)
      toast.error('Erro ao acessar câmera. Verifique as permissões.')
    }
  }

  const stopScanner = () => {
    if (qrScanner) {
      qrScanner.stop()
    }
    setScannerActive(false)
    toast.info('Scanner desativado')
  }

  const filteredGuests = guests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: guests.length,
    checkedIn: guests.filter(g => g.checked_in).length,
    pending: guests.filter(g => !g.checked_in).length,
    totalPeople: guests.filter(g => g.checked_in).reduce((sum, g) => sum + 1 + (g.has_companion ? 1 : 0), 0)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-purple-900 flex items-center justify-center gap-2">
              <UserCheck className="w-6 h-6" />
              Painel de Check-in
            </CardTitle>
            <CardDescription>Digite a senha para acessar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Entrar
              </Button>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-purple-600" />
              Check-in do Evento
            </h1>
            <p className="text-gray-600">EP "Apaixonado Como Nunca" - Portaria</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? 'text-green-600' : 'text-gray-400'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Link href="/admin">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={() => setIsAuthenticated(false)}
              className="text-red-600 hover:text-red-700"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Aprovados</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Check-in Feito</p>
                  <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aguardando</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <XCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pessoas</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalPeople}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Scanner QR Code
                </CardTitle>
                <CardDescription>
                  Use a câmera para escanear o QR Code dos convidados
                  {!scannerSupported && (
                    <span className="block text-orange-600 mt-1">
                      ⚠️ Scanner não disponível neste dispositivo
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!scannerActive ? (
                  <Button 
                    onClick={startScanner}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-8 text-lg"
                    disabled={loading || !scannerSupported}
                  >
                    <Camera className="w-6 h-6 mr-2" />
                    {loading ? 'Iniciando...' : scannerSupported ? 'Iniciar Scanner' : 'Scanner Indisponível'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <p className="text-white text-sm bg-black/50 rounded px-2 py-1">
                          {loading ? 'Processando...' : 'Aponte para o QR Code do convidado'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={stopScanner}
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                    >
                      Parar Scanner
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="w-5 h-5" />
                  Entrada Manual
                </CardTitle>
                <CardDescription>
                  Digite o código QR manualmente se necessário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualCheckin} className="space-y-4">
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Digite o código QR"
                    className="text-center font-mono"
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Verificando...' : 'Fazer Check-in Manual'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Guest List */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Lista de Convidados
                </CardTitle>
                <CardDescription>
                  Convidados aprovados e status de check-in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar convidado..."
                    className="pl-10"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className={`p-4 rounded-lg border ${
                        guest.checked_in 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{guest.name}</h3>
                            {guest.checked_in ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Check-in OK
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Aguardando
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{guest.email}</p>
                          {guest.has_companion && (
                            <p className="text-sm text-purple-600">
                              + acompanhante(s)
                            </p>
                          )}
                          {guest.checked_in && guest.checked_in_at && (
                            <p className="text-xs text-gray-500">
                              Check-in: {new Date(guest.checked_in_at).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                        
                        {!guest.checked_in && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckin(guest.id)}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Check-in
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredGuests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'Nenhum convidado encontrado' : 'Nenhum convidado aprovado'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}