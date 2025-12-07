"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  History,
} from "lucide-react"

/* ========================================================================
   ✔ TYPES - Nettoyés & uniformisés
   ======================================================================== */

interface Article {
  id: string
  nom: string
  numero_article: string
  quantite_stock: number
}

interface Personne {
  id: string
  nom: string
  prenom: string
  type: string
}

interface TypeMouvement {
  id: string
  nom: string
}

interface NumeroSerie {
  id: string
  numero_serie: string
  adresse_mac?: string
  article_id: string
  statut: string
  localisation?: string
}

interface StockTechnicien {
  id: string
  technicien_id: string
  article_id: string
  numero_serie_id?: string
  quantite: number
  localisation: string
  article: Article
  numero_serie?: NumeroSerie
}

interface Mouvement {
  id: string
  article_id: string
  numero_serie_id?: string
  personne_id?: string
  personne_source_id?: string
  type_mouvement: string
  localisation_origine?: string
  localisation_destination?: string
  remarques?: string
  date_mouvement: string
  quantite: number
  created_at: string
}

interface MouvementWithRelations extends Mouvement {
  article?: Article
  numero_serie?: NumeroSerie
  personne_source?: Personne
  personne_dest?: Personne
}

/* ========================================================================
   ✔ Composant principal
   ======================================================================== */

export default function MouvementsPage() {
  /* ======================================================================
       ✔ STATES PRINCIPAUX — nettoyés / structurés
     ====================================================================== */

  const [mouvements, setMouvements] = useState<MouvementWithRelations[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [typesMouvement, setTypesMouvement] = useState<TypeMouvement[]>([])
  const [emplacements, setEmplacements] = useState<{ id: string; nom: string }[]>([])
  const [scenarios, setScenarios] = useState<any[]>([])

  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  /* ======================================================================
       ✔ STATES DU MOUVEMENT (formulaire principal)
     ====================================================================== */

  const [mouvementData, setMouvementData] = useState({
    personne_id: "",
    personne_source_id: "",
    type_mouvement: "",
    localisation_origine: "",
    localisation_destination: "",
    remarques: "",
  })

  /* ======================================================================
       ✔ STATES DES LIGNES DU MOUVEMENT (formulaire secondaire)
     ====================================================================== */

  type LigneMvtTemp = Mouvement & {
    nouveau_numero_serie?: string
    nouvelle_adresse_mac?: string
  }

  const [lignesMouvement, setLignesMouvement] = useState<LigneMvtTemp[]>([])
  const [stockTechnicienSource, setStockTechnicienSource] = useState<StockTechnicien[]>([])

  const [ligneFormData, setLigneFormData] = useState({
    article_id: "",
    quantite: 1,
  })

  // Recherche
  const [articleSearch, setArticleSearch] = useState("")
  const [articleSearchSelect, setArticleSearchSelect] = useState("")

  // Numéros de série
  const [numerosSerieDisponibles, setNumerosSerieDisponibles] = useState<NumeroSerie[]>([])
  const [numeroSerieSelectionne, setNumeroSerieSelectionne] = useState("")
  const [nouveauNumeroSerie, setNouveauNumeroSerie] = useState("")
  const [nouvelleAdresseMac, setNouvelleAdresseMac] = useState("")

  /* ======================================================================
       ✔ STATES FILTRES LISTE
     ====================================================================== */

  const [filterSearch, setFilterSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterTechnicien, setFilterTechnicien] = useState("")
  const [filterDateDebut, setFilterDateDebut] = useState("")
  const [filterDateFin, setFilterDateFin] = useState("")

  /* ======================================================================
        ✔ CHARGEMENT INITIAL — simplifié & robuste
     ====================================================================== */

  useEffect(() => {
    async function init() {
      await Promise.all([
        fetchMouvements(),
        fetchArticles(),
        fetchPersonnes(),
        fetchTypesMouvement(),
        fetchEmplacements(),
        fetchScenarios(),
      ])
      setLoading(false)
    }
    init()
  }, [])
  /* ======================================================================
        🌐 FETCH API SUPABASE — sécurisés et optimisés
     ====================================================================== */

  const fetchMouvements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("mouvements")
        .select(`
          *,
          article:articles(nom, numero_article, quantite_stock),
          numero_serie:numeros_serie(numero_serie, adresse_mac),
          personne_source:personnes!personne_source_id(nom, prenom),
          personne_dest:personnes!personne_id(nom, prenom)
        `)
        .order("date_mouvement", { ascending: false })
        .order("created_at", { ascending: true })

      if (error) throw error
      setMouvements(data || [])
    } catch (err) {
      console.error("❌ fetchMouvements error:", err)
    }
  }, [])

  const fetchArticles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("nom")

      if (error) throw error
      setArticles(data || [])
    } catch (err) {
      console.error("❌ fetchArticles:", err)
    }
  }, [])

  const fetchPersonnes = useCallback(async () => {
    try {
      const { data } = await supabase.from("personnes").select("*")
      setPersonnes(data || [])
    } catch (err) {
      console.error("❌ fetchPersonnes:", err)
    }
  }, [])

  const fetchTypesMouvement = useCallback(async () => {
    try {
      const { data } = await supabase.from("types_mouvement").select("*")
      setTypesMouvement(data || [])
    } catch (err) {
      console.error("❌ fetchTypesMouvement:", err)
    }
  }, [])

  const fetchEmplacements = useCallback(async () => {
    try {
      const { data } = await supabase.from("emplacements").select("id, nom")
      setEmplacements(data || [])
    } catch (err) {
      console.error("❌ fetchEmplacements:", err)
    }
  }, [])

  const fetchScenarios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("scenarios_mouvement")
        .select("*")
        .order("emplacement_origine, type_mouvement")

      if (error) throw error
      setScenarios(data || [])
    } catch (err) {
      console.error("❌ fetchScenarios:", err)
    }
  }, [])

  /* ======================================================================
        📦 STOCK TECHNICIEN — sécurité & robustesse
     ====================================================================== */

  const fetchStockTechnicienSource = useCallback(
    async (technicienId: string) => {
      if (!technicienId) {
        setStockTechnicienSource([])
        return
      }

      try {
        const { data, error } = await supabase
          .from("stock_technicien")
          .select(
            `
            *,
            article:articles(*),
            numero_serie:numeros_serie(*)
          `
          )
          .eq("technicien_id", technicienId)
          .gt("quantite", 0)

        if (error) throw error
        setStockTechnicienSource(data || [])
      } catch (err) {
        console.error("❌ fetchStockTechnicienSource:", err)
        setStockTechnicienSource([])
      }
    },
    []
  )

  /* ======================================================================
        🔧 UTILITAIRES
     ====================================================================== */

  const needsTechnicienSource = useMemo(
    () => mouvementData.localisation_origine === "Stock Technicien",
    [mouvementData.localisation_origine]
  )

  const needsTechnicienDestination = useMemo(
    () => mouvementData.localisation_destination === "Stock Technicien",
    [mouvementData.localisation_destination]
  )

  const isTransfertEntreTechniciens = useMemo(
    () =>
      mouvementData.localisation_origine === "Stock Technicien" &&
      mouvementData.localisation_destination === "Stock Technicien",
    [mouvementData.localisation_origine, mouvementData.localisation_destination]
  )

  /* ======================================================================
        🧠 MAPPING TYPES (sécurisé)
     ====================================================================== */

  function mapTypeToConstraint(typeNom: string): string {
    if (!typeNom) return ""

    const map: Record<string, string> = {
      réception: "reception",
      "sortie technicien": "sortie_technicien",
      "sortie transport": "sortie_transport",
      "transfert depot": "transfert_depot",
      "transfert dépôt": "transfert_depot",
      "installation client": "installation_client",
    }

    const normalized = typeNom.toLowerCase().trim()
    return map[normalized] ?? typeNom
  }

  /* ======================================================================
       🔍 NOUVELLE VERSION DE searchArticles() (100% stable + optimisée)
     ====================================================================== */

  const searchArticles = useCallback(
    async (searchValue: string) => {
      setArticleSearch(searchValue)

      // 1️⃣ Si vide -> reset liste
      if (!searchValue.trim()) {
        if (isTransfertEntreTechniciens && mouvementData.personne_source_id) {
          const dispo = stockTechnicienSource
            .map((s) => s.article)
            .filter(Boolean) as Article[]
          setArticles(dispo)
        } else {
          fetchArticles()
        }
        return
      }

      try {
        // 2️⃣ RECHERCHE PAR NUMÉRO DE SÉRIE
        const { data: serialResults, error: serialErr } = await supabase
          .from("numeros_serie")
          .select("*, article:articles(*)")
          .or(
            `numero_serie.ilike.%${searchValue}%,adresse_mac.ilike.%${searchValue}%`
          )

        if (serialErr) throw serialErr

        if (serialResults?.length) {
          const serie = serialResults[0]

          if (isTransfertEntreTechniciens && mouvementData.personne_source_id) {
            const existsInStock = stockTechnicienSource.some(
              (s) => s.numero_serie_id === serie.id
            )

            if (!existsInStock) {
              alert("Ce numéro de série n'est pas dans le stock du technicien source")
              return
            }

            setArticles([serie.article])
            return
          }

          setArticles([serie.article])
          return
        }

        // 3️⃣ RECHERCHE ARTICLE SIMPLE
        const { data: articleResults, error } = await supabase
          .from("articles")
          .select("*")
          .or(`nom.ilike.%${searchValue}%,numero_article.ilike.%${searchValue}%`)
          .order("nom")

        if (error) throw error

        setArticles(articleResults || [])
      } catch (err) {
        console.error("❌ searchArticles:", err)
      }
    },
    [
      stockTechnicienSource,
      mouvementData.personne_source_id,
      isTransfertEntreTechniciens,
      fetchArticles,
    ]
  )

  /* ======================================================================
        🔧 LOAD NUMÉROS DE SÉRIE (corrigé + fiable)
     ====================================================================== */

  const loadNumerosSerieForArticle = useCallback(
    async (articleId: string) => {
      if (!articleId) {
        setNumerosSerieDisponibles([])
        setNumeroSerieSelectionne("")
        return
      }

      try {
        // TRANSFERT TECHNICIEN -> filtres spécifiques
        if (isTransfertEntreTechniciens && mouvementData.personne_source_id) {
          const list = stockTechnicienSource
            .filter(
              (s) => s.article_id === articleId && s.numero_serie_id !== null
            )
            .map((s) => s.numero_serie)
            .filter(Boolean) as NumeroSerie[]

          setNumerosSerieDisponibles(list)
          return
        }

        // RÉCEPTION -> tous les numéros existants
        if (mouvementData.type_mouvement?.toLowerCase().includes("reception")) {
          const { data } = await supabase
            .from("numeros_serie")
            .select("*")
            .eq("article_id", articleId)

          setNumerosSerieDisponibles(data || [])
          return
        }

        // PAR DÉFAUT -> séries disponibles
        const { data } = await supabase
          .from("numeros_serie")
          .select("*")
          .eq("article_id", articleId)
          .eq("statut", "disponible")

        setNumerosSerieDisponibles(data || [])
      } catch (err) {
        console.error("❌ loadNumerosSerieForArticle:", err)
        setNumerosSerieDisponibles([])
      }
    },
    [
      isTransfertEntreTechniciens,
      mouvementData.personne_source_id,
      mouvementData.type_mouvement,
      stockTechnicienSource,
    ]
  )
  /* ======================================================================
        🧾 FORMULAIRE PRINCIPAL – Type, origines, techniciens
     ====================================================================== */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-6 p-6">
        {/* HEADER du formulaire */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nouveau Mouvement</h1>
            <p className="text-muted-foreground">Ajouter un mouvement de stock</p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false)
              setLignesMouvement([])
            }}
          >
            Annuler
          </Button>
        </div>

        {/* ==================================================================
            🟦 CARD — Informations du mouvement
        =================================================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du Mouvement</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* -------------------------------------------------------------
                  TYPE DE MOUVEMENT
              -------------------------------------------------------------- */}
              <div>
                <Label className="block mb-2 font-semibold">Type de mouvement</Label>
                <Select
                  value={mouvementData.type_mouvement}
                  onValueChange={(value) =>
                    setMouvementData((d) => ({ ...d, type_mouvement: value }))
                  }
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>

                  <SelectContent>
                    {typesMouvement
                      .filter((t) => t.nom?.trim())
                      .map((t) => (
                        <SelectItem key={t.id} value={t.nom}>
                          {t.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* -------------------------------------------------------------
                  LOCALISATION ORIGINE
              -------------------------------------------------------------- */}
              <div>
                <Label className="block mb-2 font-semibold">Localisation d'origine</Label>

                <Select
                  value={mouvementData.localisation_origine}
                  onValueChange={(value) =>
                    setMouvementData((d) => ({
                      ...d,
                      localisation_origine: value,
                      personne_source_id: "", // reset auto si on change l'origine
                    }))
                  }
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>

                  <SelectContent>
                    {emplacements
                      .filter((e) => e.nom?.trim())
                      .map((e) => (
                        <SelectItem key={e.id} value={e.nom}>
                          {e.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* -------------------------------------------------------------
                  TECHNICIEN SOURCE (seulement si Stock Technicien)
              -------------------------------------------------------------- */}
              {mouvementData.localisation_origine === "Stock Technicien" && (
                <div>
                  <Label className="block mb-2 font-semibold">Technicien source</Label>

                  <Select
                    value={mouvementData.personne_source_id}
                    onValueChange={async (value) => {
                      const id = value === "none" ? "" : value
                      setMouvementData((d) => ({ ...d, personne_source_id: id }))
                      await fetchStockTechnicienSource(id)
                    }}
                  >
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Choisir un technicien" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>

                      {personnes
                        .filter((p) => p.type === "technicien" && p.nom?.trim())
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nom} {p.prenom}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* -------------------------------------------------------------
                  LOCALISATION DESTINATION
              -------------------------------------------------------------- */}
              <div>
                <Label className="block mb-2 font-semibold">Localisation destination</Label>

                <Select
                  value={mouvementData.localisation_destination}
                  onValueChange={(value) =>
                    setMouvementData((d) => ({
                      ...d,
                      localisation_destination: value,
                      personne_id: "", // reset auto si on change destination
                    }))
                  }
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>

                  <SelectContent>
                    {emplacements
                      .filter((e) => e.nom?.trim())
                      .map((e) => (
                        <SelectItem key={e.id} value={e.nom}>
                          {e.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* -------------------------------------------------------------
                  TECHNICIEN DESTINATION (si nécessaire)
              -------------------------------------------------------------- */}
              {mouvementData.localisation_destination === "Stock Technicien" && (
                <div>
                  <Label className="block mb-2 font-semibold">Technicien destination</Label>

                  <Select
                    value={mouvementData.personne_id}
                    onValueChange={(value) =>
                      setMouvementData((d) => ({
                        ...d,
                        personne_id: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Choisir un technicien" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>

                      {personnes
                        .filter(
                          (p) =>
                            p.type === "technicien" &&
                            p.id !== mouvementData.personne_source_id &&
                            p.nom?.trim()
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nom} {p.prenom}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            </div>

            {/* REMARQUES */}
            <div>
              <Label className="block mb-2 font-semibold">Remarques</Label>
              <Input
                className="h-14 text-lg"
                placeholder="Infos complémentaires…"
                value={mouvementData.remarques}
                onChange={(e) =>
                  setMouvementData((d) => ({ ...d, remarques: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>
        {/* ==================================================================
            🟦 CARD — Ajout d’un article (ligne mouvement)
        =================================================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un Article</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* CHAMP IMPORTANT : Recherche / Scan */}
            <div>
              <Label className="block mb-2 font-semibold">Rechercher / Scanner Article</Label>
              <Input
                className="h-14 text-lg"
                placeholder="Scanner ou rechercher par nom / numéro…"
                value={articleSearch}
                onChange={(e) => searchArticles(e.target.value)}
              />
            </div>

            {/* FORMULAIRE ADD LINE */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                ajouterLigne()
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* -------------------------------------------------------------
                    ARTICLE SELECT
                -------------------------------------------------------------- */}
                <div>
                  <Label className="block mb-2 font-semibold">Article sélectionné</Label>

                  <Select
                    value={ligneFormData.article_id}
                    onValueChange={(value) => {
                      setLigneFormData((d) => ({ ...d, article_id: value }))
                      setNumeroSerieSelectionne("")
                      loadNumerosSerieForArticle(value)
                    }}
                  >
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Choisir un article" />
                    </SelectTrigger>

                    <SelectContent>
                      {/* Barre de recherche locale */}
                      <div className="p-2 sticky top-0 bg-background z-10">
                        <Input
                          placeholder="Filtrer la liste…"
                          value={articleSearchSelect}
                          onChange={(e) => setArticleSearchSelect(e.target.value)}
                          className="h-10"
                        />
                      </div>

                      {articles
                        .filter((a) =>
                          (a.nom + a.numero_article)
                            .toLowerCase()
                            .includes(articleSearchSelect.toLowerCase())
                        )
                        .filter((a) => a.nom?.trim())
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <div className="flex flex-col py-1">
                              <span className="font-semibold">{a.nom}</span>
                              <span className="text-xs text-muted-foreground">
                                {a.numero_article} — Stock : {a.quantite_stock}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* -------------------------------------------------------------
                    NOUVEAU NUMÉRO DE SÉRIE (réception)
                -------------------------------------------------------------- */}
                {ligneFormData.article_id &&
                  mouvementData.type_mouvement
                    ?.toLowerCase()
                    .includes("reception") && (
                    <div>
                      <Label className="block mb-2 font-semibold">
                        Nouveau numéro de série (création)
                      </Label>
                      <Input
                        className="h-14 text-lg"
                        placeholder="Scanner / taper le N° de série…"
                        value={nouveauNumeroSerie}
                        onChange={(e) => setNouveauNumeroSerie(e.target.value)}
                      />

                      <Label className="block mt-3 mb-2 font-semibold">
                        Adresse MAC (optionnel)
                      </Label>
                      <Input
                        className="h-14 text-lg"
                        placeholder="Adresse MAC…"
                        value={nouvelleAdresseMac}
                        onChange={(e) => setNouvelleAdresseMac(e.target.value)}
                      />
                    </div>
                  )}

                {/* -------------------------------------------------------------
                    NUMÉRO DE SÉRIE EXISTANT
                -------------------------------------------------------------- */}
                {ligneFormData.article_id &&
                  numerosSerieDisponibles.length > 0 &&
                  !mouvementData.type_mouvement
                    ?.toLowerCase()
                    .includes("reception") && (
                    <div>
                      <Label className="block mb-2 font-semibold">
                        Sélectionner un N° de série
                      </Label>

                      <Select
                        value={numeroSerieSelectionne}
                        onValueChange={setNumeroSerieSelectionne}
                      >
                        <SelectTrigger className="h-14 text-lg">
                          <SelectValue placeholder="Numéro de série…" />
                        </SelectTrigger>

                        <SelectContent>
                          {numerosSerieDisponibles
                            .filter((s) => s.id?.trim() && s.numero_serie?.trim())
                            .map((serie) => (
                              <SelectItem key={serie.id} value={serie.id}>
                                {serie.numero_serie}
                                {serie.adresse_mac ? ` (${serie.adresse_mac})` : ""}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* -------------------------------------------------------------
                    QUANTITÉ
                -------------------------------------------------------------- */}
                <div>
                  <Label className="block mb-2 font-semibold">Quantité</Label>
                  <Input
                    className="h-14 text-lg"
                    type="number"
                    min={1}
                    value={ligneFormData.quantite}
                    onChange={(e) =>
                      setLigneFormData((d) => ({
                        ...d,
                        quantite: Number(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button type="submit" className="h-12 px-8 text-lg">
                  Ajouter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ==================================================================
            📋 LISTE DES LIGNES AJOUTÉES
        =================================================================== */}
        {lignesMouvement.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Lignes du Mouvement ({lignesMouvement.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left">Article</th>
                      <th className="p-3 text-left">Référence</th>
                      <th className="p-3 text-left">N° Série</th>
                      <th className="p-3 text-left">Adresse MAC</th>
                      <th className="p-3 text-center">Qté</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lignesMouvement.map((ligne) => {
                      const art = articles.find((a) => a.id === ligne.article_id)

                      const serie =
                        numerosSerieDisponibles.find(
                          (s) => s.id === ligne.numero_serie_id
                        ) || null

                      const displaySerie =
                        ligne.numero_serie_id
                          ? serie?.numero_serie || "Inconnu"
                          : ligne.nouveau_numero_serie || "Nouveau"

                      const displayMac =
                        ligne.numero_serie_id
                          ? serie?.adresse_mac || "-"
                          : ligne.nouvelle_adresse_mac || "-"

                      return (
                        <tr key={ligne.id} className="border-b hover:bg-muted/40">
                          <td className="p-3 font-semibold">
                            {art?.nom || "Inconnu"}
                          </td>

                          <td className="p-3 text-muted-foreground">
                            {art?.numero_article || "-"}
                          </td>

                          <td className="p-3 font-mono">{displaySerie}</td>
                          <td className="p-3 font-mono">{displayMac}</td>

                          <td className="p-3 text-center font-bold text-blue-600">
                            {ligne.quantite}
                          </td>

                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setLignesMouvement((prev) =>
                                  prev.filter((l) => l.id !== ligne.id)
                                )
                              }
                            >
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================================================================
            BOUTONS FOOTER
        =================================================================== */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            className="h-14 px-8 text-lg"
            onClick={() => {
              setShowForm(false)
              setLignesMouvement([])
              setMouvementData({
                personne_id: "",
                personne_source_id: "",
                type_mouvement: "",
                localisation_origine: "",
                localisation_destination: "",
                remarques: "",
              })
            }}
          >
            Annuler
          </Button>

          <Button
            className="h-14 px-8 text-lg"
            onClick={validerMouvement}
          >
            Valider ({lignesMouvement.length})
          </Button>
        </div>
      </div>
    )
  }
  /* ======================================================================
        ✅ VALIDATION DU MOUVEMENT
     ====================================================================== */

  async function validerMouvement() {
    if (!mouvementData.type_mouvement) {
      alert("Veuillez sélectionner un type de mouvement.")
      return
    }

    if (!mouvementData.localisation_origine) {
      alert("Veuillez sélectionner une localisation d'origine.")
      return
    }

    if (!mouvementData.localisation_destination) {
      alert("Veuillez sélectionner une localisation de destination.")
      return
    }

    if (lignesMouvement.length === 0) {
      alert("Veuillez ajouter au moins un article.")
      return
    }

    const typeNorm = mapTypeToConstraint(mouvementData.type_mouvement)

    try {
      for (const ligne of lignesMouvement) {
        let numeroSerieId = ligne.numero_serie_id

        /* ---------------------------------------------------------
            SI NOUVEAU NUMÉRO DE SÉRIE → CRÉER DANS LA BASE
        ---------------------------------------------------------- */
        if (ligne.nouveau_numero_serie?.trim()) {
          const { data: ns, error: nsErr } = await supabase
            .from("numeros_serie")
            .insert({
              numero_serie: ligne.nouveau_numero_serie,
              adresse_mac: ligne.nouvelle_adresse_mac || null,
              article_id: ligne.article_id,
              statut: "disponible",
            })
            .select()
            .single()

          if (nsErr) throw nsErr

          numeroSerieId = ns.id
        }

        /* ---------------------------------------------------------
            INSERT DU MOUVEMENT
        ---------------------------------------------------------- */
        const { error: mvtErr } = await supabase.from("mouvements").insert({
          article_id: ligne.article_id,
          numero_serie_id: numeroSerieId || null,
          type_mouvement: mouvementData.type_mouvement,
          localisation_origine: mouvementData.localisation_origine,
          localisation_destination: mouvementData.localisation_destination,
          personne_source_id: mouvementData.personne_source_id || null,
          personne_id: mouvementData.personne_id || null,
          quantite: ligne.quantite,
          remarques: mouvementData.remarques || null,
        })

        if (mvtErr) throw mvtErr

        /* ---------------------------------------------------------
            GESTION STOCK SELON TYPE
        ---------------------------------------------------------- */

        // 🔹 RÉCEPTION
        if (typeNorm === "reception") {
          await supabase.rpc("incrementer_stock_article", {
            article_id_input: ligne.article_id,
            quantite_input: ligne.quantite,
          })
        }

        // 🔹 SORTIE TECHNICIEN
        if (typeNorm === "sortie_technicien") {
          await supabase.rpc("sortie_technicien_article", {
            article_id_input: ligne.article_id,
            technicien_id_input: mouvementData.personne_id,
            quantite_input: ligne.quantite,
            numero_serie_id_input: numeroSerieId || null,
          })
        }

        // 🔹 TRANSFERT TECHNICIEN
        if (typeNorm === "transfert_depot") {
          await supabase.rpc("transfert_technicien", {
            article_id_input: ligne.article_id,
            technicien_source_id_input: mouvementData.personne_source_id,
            technicien_dest_id_input: mouvementData.personne_id,
            quantite_input: ligne.quantite,
            numero_serie_id_input: numeroSerieId || null,
          })
        }

        // 🔹 INSTALLATION CLIENT
        if (typeNorm === "installation_client") {
          await supabase.rpc("installation_client", {
            article_id_input: ligne.article_id,
            technicien_id_input: mouvementData.personne_source_id,
            quantite_input: ligne.quantite,
            numero_serie_id_input: numeroSerieId || null,
          })
        }
      }

      alert("Mouvement enregistré avec succès !")
      setShowForm(false)
      setLignesMouvement([])

      await fetchMouvements()
      await fetchArticles()
    } catch (err) {
      console.error("❌ Erreur validation mouvement:", err)
      alert("Erreur lors de la validation du mouvement.")
    }
  }

  /* ======================================================================
        📊 SECTION LISTE DES MOUVEMENTS
     ====================================================================== */

  const mouvementsFiltres = useMemo(() => {
    return mouvements.filter((m) => {
      if (
        filterSearch &&
        !(
          m.article?.nom?.toLowerCase().includes(filterSearch.toLowerCase()) ||
          m.numero_serie?.numero_serie
            ?.toLowerCase()
            .includes(filterSearch.toLowerCase()) ||
          m.personne_source?.nom
            ?.toLowerCase()
            .includes(filterSearch.toLowerCase()) ||
          m.personne_dest?.nom
            ?.toLowerCase()
            .includes(filterSearch.toLowerCase())
        )
      ) {
        return false
      }

      if (filterType && m.type_mouvement !== filterType) return false
      if (filterTechnicien &&
          !(
            m.personne_source_id === filterTechnicien ||
            m.personne_id === filterTechnicien
          )
      ) {
        return false
      }

      if (filterDateDebut && m.date_mouvement < filterDateDebut) return false
      if (filterDateFin && m.date_mouvement > filterDateFin) return false

      return true
    })
  }, [
    mouvements,
    filterSearch,
    filterType,
    filterTechnicien,
    filterDateDebut,
    filterDateFin,
  ])

  /* ======================================================================
        PAGE PRINCIPALE
     ====================================================================== */

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mouvements de Stock</h1>
          <p className="text-muted-foreground">
            Visualiser et filtrer les derniers mouvements
          </p>
        </div>

        <Button className="h-12 px-6" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-5 w-5" /> Nouveau mouvement
        </Button>
      </div>

      {/* ==================================================================
          FILTRES
      =================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">

          <div>
            <Label>Recherche</Label>
            <Input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Article, série, technicien…"
              className="h-12"
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {typesMouvement
                  .filter((t) => t.nom?.trim())
                  .map((t) => (
                    <SelectItem key={t.id} value={t.nom}>
                      {t.nom}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Technicien</Label>
            <Select
              value={filterTechnicien}
              onValueChange={setFilterTechnicien}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {personnes
                  .filter((p) => p.type === "technicien")
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom} {p.prenom}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Début</Label>
              <Input
                type="date"
                value={filterDateDebut}
                onChange={(e) => setFilterDateDebut(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label>Fin</Label>
              <Input
                type="date"
                value={filterDateFin}
                onChange={(e) => setFilterDateFin(e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ==================================================================
          TABLEAU DES MOUVEMENTS
      =================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle>Mouvements ({mouvementsFiltres.length})</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Article</th>
                <th className="p-3 text-left">N° Série</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-left">Destination</th>
                <th className="p-3 text-left">Qté</th>
              </tr>
            </thead>

            <tbody>
              {mouvementsFiltres.map((m) => (
                <tr key={m.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">{m.date_mouvement?.slice(0, 10)}</td>
                  <td className="p-3">{m.article?.nom}</td>
                  <td className="p-3 font-mono text-sm">
                    {m.numero_serie?.numero_serie || "-"}
                  </td>
                  <td className="p-3 font-semibold">{m.type_mouvement}</td>
                  <td className="p-3">{m.personne_source?.nom || m.localisation_origine}</td>
                  <td className="p-3">{m.personne_dest?.nom || m.localisation_destination}</td>
                  <td className="p-3 font-bold">{m.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
