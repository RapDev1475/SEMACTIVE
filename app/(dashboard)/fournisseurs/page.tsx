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
import { Plus, Search, Building2, Mail, Phone, Globe } from "lucide-react"
import type { Fournisseur } from "@/lib/types"

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    nom: "",
    code_fournisseur: "",
    adresse: "",
    code_postal: "",
    ville: "",
    pays: "Belgique",
    telephone: "",
    email: "",
    site_web: "",
    contact_principal: "",
    conditions_paiement: "",
    delai_livraison_jours: 7,
    remarques: "",
    actif: true,
  })

  useEffect(() => {
    fetchFournisseurs()
  }, [])

  async function fetchFournisseurs() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .order('nom')

      if (error) throw error
      setFournisseurs(data || [])
    } catch (error) {
      console.error('Error fetching fournisseurs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('fournisseurs')
        .insert([formData])

      if (error) throw error

      setDialogOpen(false)
      fetchFournisseurs()
      
      setFormData({
        nom: "",
        code_fournisseur: "",
        adresse: "",
        code_postal: "",
        ville: "",
        pays: "Belgique",
        telephone: "",
        email: "",
        site_web: "",
        contact_principal: "",
        conditions_paiement: "",
        delai_livraison_jours: 7,
        remarques: "",
        actif: true,
      })
    } catch (error: any) {
      alert("Erreur: " + error.message)
    }
  }

  const filteredFournisseurs = fournisseurs.filter(f =>
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.code_fournisseur && f.code_fournisseur.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.email && f.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const stats = {
    total: fournisseurs.length,
    actifs: fournisseurs.filter(f => f.actif).length,
    inactifs: fournisseurs.filter(f => !f.actif).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des fournisseurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fournisseurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos fournisseurs et leurs informations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-shimmer">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau fournisseur</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau fournisseur à votre base
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du fournisseur *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                    placeholder="Ex: TechDistribution SA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code_fournisseur">Code fournisseur</Label>
                  <Input
                    id="code_fournisseur"
                    value={formData.code_fournisseur}
                    onChange={(e) => setFormData({...formData, code_fournisseur: e.target.value})}
                    placeholder="FOURN-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  placeholder="Rue de l'Industrie 15"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code_postal">Code postal</Label>
                  <Input
                    id="code_postal"
                    value={formData.code_postal}
                    onChange={(e) => setFormData({...formData, code_postal: e.target.value})}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                    placeholder="Bruxelles"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pays">Pays</Label>
                  <Input
                    id="pays"
                    value={formData.pays}
                    onChange={(e) => setFormData({...formData, pays: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    placeholder="+32 2 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contact@fournisseur.be"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site_web">Site web</Label>
                  <Input
                    id="site_web"
                    type="url"
                    value={formData.site_web}
                    onChange={(e) => setFormData({...formData, site_web: e.target.value})}
                    placeholder="https://fournisseur.be"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_principal">Contact principal</Label>
                  <Input
                    id="contact_principal"
                    value={formData.contact_principal}
                    onChange={(e) => setFormData({...formData, contact_principal: e.target.value})}
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conditions_paiement">Conditions de paiement</Label>
                  <Input
                    id="conditions_paiement"
                    value={formData.conditions_paiement}
                    onChange={(e) => setFormData({...formData, conditions_paiement: e.target.value})}
                    placeholder="30 jours fin de mois"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delai_livraison_jours">Délai de livraison (jours)</Label>
                  <Input
                    id="delai_livraison_jours"
                    type="number"
                    min="0"
                    value={formData.delai_livraison_jours}
                    onChange={(e) => setFormData({...formData, delai_livraison_jours: parseInt(e.target.value)})}
                  />
                </div>
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
                  Créer le fournisseur
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total fournisseurs
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actifs
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.actifs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactifs
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactifs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fournisseurs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFournisseurs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucun fournisseur trouvé
            </CardContent>
          </Card>
        ) : (
          filteredFournisseurs.map((fournisseur) => (
            <Card key={fournisseur.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{fournisseur.nom}</CardTitle>
                    {fournisseur.code_fournisseur && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {fournisseur.code_fournisseur}
                      </p>
                    )}
                  </div>
                  <Badge variant={fournisseur.actif ? "default" : "secondary"}>
                    {fournisseur.actif ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {fournisseur.adresse && (
                  <div className="text-sm">
                    <p>{fournisseur.adresse}</p>
                    <p>
                      {fournisseur.code_postal} {fournisseur.ville}
                    </p>
                    <p className="text-muted-foreground">{fournisseur.pays}</p>
                  </div>
                )}
                
                <div className="space-y-2 pt-2 border-t">
                  {fournisseur.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${fournisseur.telephone}`} className="hover:underline">
                        {fournisseur.telephone}
                      </a>
                    </div>
                  )}
                  {fournisseur.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${fournisseur.email}`} className="hover:underline">
                        {fournisseur.email}
                      </a>
                    </div>
                  )}
                  {fournisseur.site_web && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={fournisseur.site_web} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Site web
                      </a>
                    </div>
                  )}
                </div>

                {fournisseur.delai_livraison_jours && (
                  <div className="pt-2 border-t text-sm text-muted-foreground">
                    Délai de livraison : {fournisseur.delai_livraison_jours} jours
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
