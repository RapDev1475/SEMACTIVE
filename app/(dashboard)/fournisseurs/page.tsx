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
import { Plus, Search, Building2, Mail, Phone, Globe, Edit } from "lucide-react"
import type { Fournisseur } from "@/lib/types"

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null)
  
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
	numero_tva: "",
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
      if (editingFournisseur) {
        // Mode édition
        const { error } = await supabase
          .from('fournisseurs')
          .update(formData)
          .eq('id', editingFournisseur.id)

        if (error) throw error
      } else {
        // Mode création
        const { error } = await supabase
          .from('fournisseurs')
          .insert([formData])

        if (error) throw error
      }

      setDialogOpen(false)
      setEditingFournisseur(null)
      fetchFournisseurs()
      resetForm()
    } catch (error: any) {
      alert("Erreur: " + error.message)
    }
  }

  function handleEdit(fournisseur: Fournisseur) {
    setEditingFournisseur(fournisseur)
    setFormData({
      nom: fournisseur.nom,
      code_fournisseur: fournisseur.code_fournisseur || "",
      adresse: fournisseur.adresse || "",
      code_postal: fournisseur.code_postal || "",
      ville: fournisseur.ville || "",
      pays: fournisseur.pays || "Belgique",
      telephone: fournisseur.telephone || "",
      email: fournisseur.email || "",
      site_web: fournisseur.site_web || "",
      contact_principal: fournisseur.contact_principal || "",
	  numero_tva: fournisseur.numero_tva || "",
      conditions_paiement: fournisseur.conditions_paiement || "",
      delai_livraison_jours: fournisseur.delai_livraison_jours || 7,
      remarques: fournisseur.remarques || "",
      actif: fournisseur.actif ?? true,
    })
    setDialogOpen(true)
  }

  function resetForm() {
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
	  numero_tva: "",
      conditions_paiement: "",
      delai_livraison_jours: 7,
      remarques: "",
      actif: true,
    })
  }

	const filteredFournisseurs = fournisseurs.filter(f =>
	f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
	(f.code_fournisseur && f.code_fournisseur.toLowerCase().includes(searchTerm.toLowerCase())) ||
	(f.email && f.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
	(f.numero_tva && f.numero_tva.toLowerCase().includes(searchTerm.toLowerCase()))
	)

  const stats = {
    total: fournisseurs.length,
    actifs: fournisseurs.filter(f => f.actif).length,
    inactifs: fournisseurs.filter(f => !f.actif).length,
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
          <h1 className="text-3xl font-bold tracking-tight">Fournisseurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos fournisseurs et leurs informations
          </p>
        </div>
        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditingFournisseur(null)
              resetForm()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="btn-shimmer">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFournisseur ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
              </DialogTitle>
              <DialogDescription>
                {editingFournisseur 
                  ? "Modifiez les informations de ce fournisseur"
                  : "Ajoutez un nouveau fournisseur à votre base"
                }
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
                    placeholder="ACME Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code_fournisseur">Code fournisseur</Label>
                  <Input
                    id="code_fournisseur"
                    value={formData.code_fournisseur}
                    onChange={(e) => setFormData({...formData, code_fournisseur: e.target.value})}
                    placeholder="ACME"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  placeholder="123 Rue Example"
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
                    placeholder="Belgique"
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
                    placeholder="contact@exemple.be"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_web">Site web</Label>
                <Input
                  id="site_web"
                  type="url"
                  value={formData.site_web}
                  onChange={(e) => setFormData({...formData, site_web: e.target.value})}
                  placeholder="https://www.exemple.be"
                />
              </div>
			  <div className="space-y-2">
				<Label htmlFor="numero_tva">Numéro de TVA</Label>
				<Input
					id="numero_tva"
					value={formData.numero_tva}
					onChange={(e) => setFormData({...formData, numero_tva: e.target.value})}
					placeholder="BE 0123.456.789"
				/>
				</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_principal">Contact principal</Label>
                  <Input
                    id="contact_principal"
                    value={formData.contact_principal}
                    onChange={(e) => setFormData({...formData, contact_principal: e.target.value})}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delai_livraison_jours">Délai livraison (jours)</Label>
                  <Input
                    id="delai_livraison_jours"
                    type="number"
                    value={formData.delai_livraison_jours}
                    onChange={(e) => setFormData({...formData, delai_livraison_jours: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions_paiement">Conditions de paiement</Label>
                <Input
                  id="conditions_paiement"
                  value={formData.conditions_paiement}
                  onChange={(e) => setFormData({...formData, conditions_paiement: e.target.value})}
                  placeholder="Net 30 jours"
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false)
                    setEditingFournisseur(null)
                    resetForm()
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingFournisseur ? "Mettre à jour" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
            <Building2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactifs}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, code, email ou TVA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFournisseurs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun fournisseur trouvé</p>
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
              <CardContent className="space-y-2">
                {fournisseur.adresse && (
                  <p className="text-sm">
                    {fournisseur.adresse}
                    {fournisseur.code_postal && `, ${fournisseur.code_postal}`}
                    {fournisseur.ville && ` ${fournisseur.ville}`}
                  </p>
                )}
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
                    <a href={fournisseur.site_web} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Site web
                    </a>
                  </div>
                )}
				{fournisseur.numero_tva && (
				<div className="flex items-center gap-2 text-sm">
					<Badge variant="outline" className="text-xs">
					TVA: {fournisseur.numero_tva}
					</Badge>
				</div>
				)}
                {fournisseur.delai_livraison_jours && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Délai de livraison: {fournisseur.delai_livraison_jours} jours
                  </p>
                )}

                {/* Bouton modifier */}
                <div className="pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleEdit(fournisseur)}
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
