"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Users, User, Phone, Mail } from "lucide-react"
import type { Personne } from "@/lib/types"

export default function TechniciensPage() {
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  
const [formData, setFormData] = useState({
  nom: "",
  prenom: "",
  type: "technicien" as "technicien" | "client" | "gestionnaire" | "transporteur" | "fournisseur" | "autre",
  email: "",
  telephone: "",
  entreprise: "",
  numero_perid: "",     // ← Ajoutez cette ligne
  erp_id: "",           // ← Ajoutez cette ligne
  remarques: "",
})

  useEffect(() => {
    fetchPersonnes()
  }, [])

  async function fetchPersonnes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('personnes')
        .select('*')
        .order('nom')

      if (error) throw error
      setPersonnes(data || [])
    } catch (error) {
      console.error('Error fetching personnes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('personnes')
        .insert([formData])

      if (error) throw error

      setDialogOpen(false)
      fetchPersonnes()
      
      setFormData({
		nom: "",
		prenom: "",
		type: "technicien",
		email: "",
		telephone: "",
		entreprise: "",
		numero_perid: "",     // ← Ajoutez cette ligne
		erp_id: "",           // ← Ajoutez cette ligne
		remarques: "",
		})
    } catch (error: any) {
      alert("Erreur: " + error.message)
    }
  }

  const filteredPersonnes = personnes.filter(p => {
    const matchesSearch = 
		p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(p.prenom && p.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
		(p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
		(p.numero_perid && p.numero_perid.toLowerCase().includes(searchTerm.toLowerCase())) ||
		(p.erp_id && p.erp_id.toLowerCase().includes(searchTerm.toLowerCase()))
    
    if (filterType === "all") return matchesSearch
    return matchesSearch && p.type === filterType
  })

  const stats = {
    total: personnes.length,
    techniciens: personnes.filter(p => p.type === 'technicien').length,
    clients: personnes.filter(p => p.type === 'client').length,
    fournisseurs: personnes.filter(p => p.type === 'fournisseur').length,
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      technicien: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800',
      fournisseur: 'bg-purple-100 text-purple-800',
      autre: 'bg-gray-100 text-gray-800',
    }
    return variants[type] || variants.autre
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Techniciens & Personnes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos techniciens, clients et contacts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-shimmer">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle personne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter une personne</DialogTitle>
              <DialogDescription>
                Ajoutez un technicien, client ou autre contact
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                    placeholder="Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    required
                    placeholder="Jean"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technicien">Technicien</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="fournisseur">Fournisseur</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
			  {formData.type === 'technicien' && (
				<div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
					<div className="col-span-2">
					<p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
						Identifiants technicien
					</p>
					</div>
					<div className="space-y-2">
					<Label htmlFor="numero_perid">Numéro PERID</Label>
					<Input
						id="numero_perid"
						value={formData.numero_perid}
					onChange={(e) => setFormData({...formData, numero_perid: e.target.value})}
						placeholder="ID Proximus/Orange"
					/>
					<p className="text-xs text-muted-foreground">
						Identifiant Proximus ou Orange
					</p>
					</div>
					<div className="space-y-2">
					<Label htmlFor="erp_id">ERP ID</Label>
					<Input
						id="erp_id"
						value={formData.erp_id}
						onChange={(e) => setFormData({...formData, erp_id: e.target.value})}
						placeholder="ID interne"
					/>
					<p className="text-xs text-muted-foreground">
						Identifiant interne entreprise
					</p>
					</div>
				</div>
				)}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="jean.dupont@exemple.be"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    placeholder="+32 123 45 67 89"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entreprise">Entreprise</Label>
                <Input
                  id="entreprise"
                  value={formData.entreprise}
                  onChange={(e) => setFormData({...formData, entreprise: e.target.value})}
                  placeholder="Nom de l'entreprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarques">Remarques</Label>
                <Input
                  id="remarques"
                  value={formData.remarques}
                  onChange={(e) => setFormData({...formData, remarques: e.target.value})}
                  placeholder="Notes supplémentaires..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Ajouter
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total personnes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Techniciens
            </CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.techniciens}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients
            </CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fournisseurs
            </CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fournisseurs}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="technicien">Techniciens</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="fournisseur">Fournisseurs</SelectItem>
                <SelectItem value="autre">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPersonnes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune personne trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredPersonnes.map((personne) => (
            <Card key={personne.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {personne.nom} {personne.prenom}
                    </CardTitle>
                    {personne.entreprise && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {personne.entreprise}
                      </p>
                    )}
                  </div>
                  <Badge className={getTypeBadge(personne.type)}>
                    {personne.type.charAt(0).toUpperCase() + personne.type.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
			  {personne.type === 'technicien' && (personne.numero_perid || personne.erp_id) && (
			<div className="space-y-1 pb-2 border-b">
			{personne.numero_perid && (
				<div className="flex items-center justify-between text-sm">
				<span className="text-muted-foreground">PERID:</span>
				<span className="font-mono font-semibold">{personne.numero_perid}</span>
				</div>
			)}
			{personne.erp_id && (
				<div className="flex items-center justify-between text-sm">
				<span className="text-muted-foreground">ERP ID:</span>
				<span className="font-mono font-semibold">{personne.erp_id}</span>
				</div>
			)}
		</div>
		)}
                {personne.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${personne.email}`} className="hover:underline">
                      {personne.email}
                    </a>
                  </div>
                )}
                {personne.telephone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${personne.telephone}`} className="hover:underline">
                      {personne.telephone}
                    </a>
                  </div>
                )}
                {personne.remarques && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    {personne.remarques}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}