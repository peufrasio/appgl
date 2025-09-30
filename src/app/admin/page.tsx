'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Mail, 
  Search, 
  Home,
  Settings,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { getGuests, updateGuest, generateQRCode, type Guest } from '@/lib/supabase'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [guests, setGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

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
      setGuests(data || [])
    } catch (error) {
      console.error('Erro ao carregar convidados:', error)
      toast.error('Erro ao carregar convidados')
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin123') {
      setIsAuthenticated(true)
      toast.success('Login realizado com sucesso!')
    } else {
      toast.error('Senha incorreta!')
    }
  }

  const handleApproveGuest = async (guestId: string) => {
    setLoading(true)
    try {
      const qrCode = generateQRCode(guestId)
      await updateGuest(guestId, { 
        status: 'approved',
        qr_code: qrCode
      })
      
      await loadGuests()
      toast.success('Convidado aprovado com sucesso!')
      
      // Send email notification
      const guest = guests.find(g => g.id === guestId)
      if (guest) {
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              guestId: guest.id,
              guestEmail: guest.email,
              guestName: guest.name,
              qrCode: qrCode
            }),
          })

          if (response.ok) {
            toast.success('E-mail de confirmação enviado!')
          } else {
            toast.error('Erro ao enviar e-mail de confirmação')
          }
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError)
          toast.error('Erro ao enviar e-mail de confirmação')
        }
      }
    } catch (error) {
      console.error('Erro ao aprovar convidado:', error)
      toast.error('Erro ao aprovar convidado')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectGuest = async (guestId: string) => {
    setLoading(true)
    try {
      await updateGuest(guestId, { status: 'rejected' })
      await loadGuests()
      toast.success('Convidado rejeitado')
    } catch (error) {
      console.error('Erro ao rejeitar convidado:', error)
      toast.error('Erro ao rejeitar convidado')
    } finally {
      setLoading(false)
    }
  }

  const filteredGuests = guests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: guests.length,
    pending: guests.filter(g => g.status === 'pending').length,
    approved: guests.filter(g => g.status === 'approved').length,
    rejected: guests.filter(g => g.status === 'rejected').length,
    checkedIn: guests.filter(g => g.checked_in).length
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-red-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-purple-900 flex items-center justify-center gap-2">
              <Settings className="w-6 h-6" />
              Painel Administrativo
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
              <Settings className="w-8 h-8 text-purple-600" />
              Painel Administrativo
            </h1>
            <p className="text-gray-600">EP "Apaixonado Como Nunca" - Gerenciamento</p>
          </div>
          <div className="flex gap-2">
            <Link href="/checkin">
              <Button variant="outline">
                <UserCheck className="w-4 h-4 mr-2" />
                Check-in
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
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
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejeitados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.checkedIn}</p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guest Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciar Convidados
            </CardTitle>
            <CardDescription>
              Aprovar ou rejeitar inscrições de convidados
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

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="p-4 rounded-lg border bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{guest.name}</h3>
                        {guest.status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                        {guest.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprovado
                          </Badge>
                        )}
                        {guest.status === 'rejected' && (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejeitado
                          </Badge>
                        )}
                        {guest.checked_in && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Check-in OK
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>E-mail:</strong> {guest.email}</p>
                        <p><strong>Telefone:</strong> {guest.phone}</p>
                        {guest.instagram && (
                          <p><strong>Instagram:</strong> {guest.instagram}</p>
                        )}
                        {guest.has_companion && (
                          <p className="text-purple-600"><strong>Tem acompanhante</strong></p>
                        )}
                        <p><strong>Inscrito em:</strong> {new Date(guest.created_at).toLocaleString('pt-BR')}</p>
                        {guest.qr_code && (
                          <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                            <strong>QR Code:</strong> {guest.qr_code}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {guest.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveGuest(guest.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectGuest(guest.id)}
                            disabled={loading}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      
                      {guest.status === 'approved' && !guest.checked_in && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectGuest(guest.id)}
                          disabled={loading}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredGuests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Nenhum convidado encontrado' : 'Nenhuma inscrição encontrada'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}