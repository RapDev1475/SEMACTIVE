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
import { Plus, Search, Users, User, Phone, Mail, Edit, MapPin, CreditCard } from "lucide-react"
import type { Personne } from "@/lib/types"

export default function TechniciensPage() {
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Personne | null>(null)
  
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    type: "technicien" as "technicien" | "client" | "gestionnaire" | "transporteur" | "fournisseur" | "autre",
    email: "",
    telephone: "",
    entreprise: "",
    numero_perid: "",
    erp_id: "",
    remarques: "",
    numero_tva: "",
    iban: "",
    bic: "",
    delai_paiement_jours: "",
    adresse: "",
    numero: "",
    boite_postale: "",
    code_postal: "",
    commune: "",
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
      const dataToSave = {
        ...formData,
        delai_paiement_jours: formData.delai_paiement_jours ? parseInt(formData.delai_paiement_jours) : null
      }

      if (editingPerson) {
        const { error } = await supabase
          .from('personnes')
          .update(dataToSave)
          .eq('id', editingPerson.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('personnes')
          .insert([dataToSave])

        if (error) throw error
      }

      setDialogOpen(false)
      setEditingPerson(null)
      fetchPersonnes()
      
      setFormData({
        nom: "",
        prenom: "",
        type: "technicien",
        email: "",
        telephone: "",
        entreprise: "",
        numero_perid: "",
        erp_id: "",
        remarques: "",
        numero_tva: "",
        iban: "",
        bic: "",
        delai_paiement_jours: "",
        adresse: "",
        numero: "",
        boite_postale: "",
        code_postal: "",
        commune: "",
      })
    } catch (error: any) {
      alert("Erreur: " + error.message)
    }
  }

  function handleEdit(personne: any) {
    setEditingPerson(personne)
    setFormData({
      nom: personne.nom,
      prenom: personne.prenom || "",
      type: personne.type,
      email: personne.email || "",
      telephone: personne.telephone || "",
      entreprise: personne.entreprise || "",
      numero_perid: personne.numero_perid || "",
      erp_id: personne.erp_id || "",
      remarques: personne.remarques || "",
      numero_tva: personne.numero_tva || "",
      iban: personne.iban || "",
      bic: personne.bic || "",
      delai_paiement_jours: personne.delai_paiement_jours?.toString() || "",
      adresse: personne.adresse || "",
      numero: personne.numero || "",
      boite_postale: personne.boite_postale || "",
      code_postal: personne.code_postal || "",
      commune: personne.commune || "",
    })
    setDialogOpen(true)
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
        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditingPerson(null)
              setFormData({
                nom: "",
                prenom: "",
                type: "technicien",
                email: "",
                telephone: "",
                entreprise: "",
                numero_perid: "",
                erp_id: "",
                remarques: "",
                numero_tva: "",
                iban: "",
                bic: "",
                delai_paiement_jours: "",
                adresse: "",
                numero: "",
                boite_postale: "",
                code_postal: "",
                commune: "",
              })
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="btn-shimmer">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle personne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPerson ? "Modifier la personne" : "Ajouter une personne"}
              </DialogTitle>
              <DialogDescription>
                {editingPerson 
                  ? "Modifiez les informations de cette personne"
                  : "Ajoutez un technicien, client ou autre contact"
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Informations générales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
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
              </div>

              {/* Identifiants technicien */}
              {formData.type === 'technicien' && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Identifiants technicien
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero_perid">Numéro PERID</Label>
                      <Input
                        id="numero_perid"
                        value={formData.numero_perid}
                        onChange={(e) => setFormData({...formData, numero_perid: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="erp_id">ERP ID</Label>
                      <Input
                        id="erp_id"
                        value={formData.erp_id}
                        onChange={(e) => setFormData({...formData, erp_id: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Coordonnées */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Coordonnées</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entreprise">Entreprise</Label>
                  <Input
                    id="entreprise"
                    value={formData.entreprise}
                    onChange={(e) => setFormData({...formData, entreprise: e.target.value})}
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Adresse</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="adresse">Rue</Label>
                    <Input
                      id="adresse"
                      value={formData.adresse}
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Numéro</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="boite_postale">Boîte</Label>
                    <Input
                      id="boite_postale"
                      value={formData.boite_postale}
                      onChange={(e) => setFormData({...formData, boite_postale: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code_postal">Code postal</Label>
                    <Input
                      id="code_postal"
                      value={formData.code_postal}
                      onChange={(e) => setFormData({...formData, code_postal: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commune">Commune</Label>
                    <Input
                      id="commune"
                      value={formData.commune}
                      onChange={(e) => setFormData({...formData, commune: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Informations financières */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Informations financières</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero_tva">Numéro TVA</Label>
                    <Input
                      id="numero_tva"
                      value={formData.numero_tva}
                      onChange={(e) => setFormData({...formData, numero_tva: e.target.value})}
                      placeholder="BE0123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delai_paiement_jours">Délai paiement (jours)</Label>
                    <Input
                      id="delai_paiement_jours"
                      type="number"
                      value={formData.delai_paiement_jours}
                      onChange={(e) => setFormData({...formData, delai_paiement_jours: e.target.value})}
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({...formData, iban: e.target.value})}
                      placeholder="BE00 0000 0000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bic">BIC</Label>
                    <Input
                      id="bic"
                      value={formData.bic}
                      onChange={(e) => setFormData({...formData, bic: e.target.value})}
                      placeholder="GEBABEBB"
                    />
                  </div>
                </div>
              </div>

              {/* Remarques */}
              <div className="space-y-2">
                <Label htmlFor="remarques">Remarques</Label>
                <Input
                  id="remarques"
                  value={formData.remarques}
                  onChange={(e) => setFormData({...formData, remarques: e.target.value})}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingPerson ? "Mettre à jour" : "Ajouter"}
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
          filteredPersonnes.map((personne: any) => (
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
              <CardContent className="space-y-3">
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
                    <a href={`mailto:${personne.email}`} className="hover:underline truncate">
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
                {(personne.adresse || personne.commune) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {personne.adresse && <div>{personne.adresse} {personne.numero}</div>}
                      {personne.commune && <div>{personne.code_postal} {personne.commune}</div>}
                    </div>
                  </div>
                )}
                {(personne.numero_tva || personne.iban) && (
                  <div className="space-y-1 pt-2 border-t">
                    {personne.numero_tva && (
                      <div className="flex items-center gap-2 text-xs">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">TVA:</span>
                        <span className="font-mono">{personne.numero_tva}</span>
                      </div>
                    )}
                    {personne.iban && (
                      <div className="flex items-center gap-2 text-xs">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">IBAN:</span>
                        <span className="font-mono">{personne.iban}</span>
                      </div>
                    )}
                  </div>
                )}
                {personne.remarques && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    {personne.remarques}
                  </p>
                )}
                <div className="pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleEdit(personne)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}