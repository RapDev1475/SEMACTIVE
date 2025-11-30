#!/usr/bin/env python3
"""
Script d'import des données CSV vers Supabase
Pour l'application SEMACTIVE
"""

import csv
import os
from supabase import create_client, Client
from datetime import datetime

# ========================================
# CONFIGURATION
# ========================================
SUPABASE_URL = "https://egfoowiuuzwfxvbecpjo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnZm9vd2l1dXp3Znh2YmVjcGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDg1ODAsImV4cCI6MjA3OTk4NDU4MH0.QBhCLR0FlEuIAy2IC2b3SYpFInJX1z4rrWd0F-qTijw"  

# Chemins des fichiers CSV
ARTICLES_CSV = "ArticlesS30.csv"
SERIAL_NUMBERS_CSV = "SerialNumberArticle.csv"

# ========================================
# INITIALISATION
# ========================================
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Dictionnaires de mapping
fournisseurs_map = {}
articles_map = {}
techniciens_map = {}

# ========================================
# ÉTAPE 1 : CRÉER LES FOURNISSEURS
# ========================================
def create_fournisseurs():
    """Crée tous les fournisseurs uniques trouvés dans le CSV"""
    print("\n=== CRÉATION DES FOURNISSEURS ===")
    
    fournisseurs_uniques = set()
    
    # Lire le CSV pour extraire les fournisseurs
    with open(ARTICLES_CSV, 'r', encoding='utf-8-sig') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            supplier1 = row.get('SUPPLIER', '').strip()
            supplier2 = row.get('SUPPLIER2', '').strip()
            
            if supplier1 and supplier1 != '':
                fournisseurs_uniques.add(supplier1)
            if supplier2 and supplier2 != '':
                fournisseurs_uniques.add(supplier2)
    
    print(f"Trouvé {len(fournisseurs_uniques)} fournisseurs uniques")
    
    # Créer les fournisseurs dans Supabase
    for nom_fournisseur in fournisseurs_uniques:
        try:
            # Vérifier s'il existe déjà
            existing = supabase.table('fournisseurs').select('id, nom').eq('nom', nom_fournisseur).execute()
            
            if existing.data:
                fournisseur_id = existing.data[0]['id']
                print(f"✓ Fournisseur existant: {nom_fournisseur}")
            else:
                # Créer le nouveau fournisseur
                data = {
                    'nom': nom_fournisseur,
                    'code_fournisseur': nom_fournisseur[:20].upper().replace(' ', '_'),
                    'actif': True
                }
                result = supabase.table('fournisseurs').insert(data).execute()
                fournisseur_id = result.data[0]['id']
                print(f"✓ Créé: {nom_fournisseur}")
            
            fournisseurs_map[nom_fournisseur] = fournisseur_id
            
        except Exception as e:
            print(f"✗ Erreur pour {nom_fournisseur}: {e}")
    
    print(f"\n{len(fournisseurs_map)} fournisseurs dans la base")
    return fournisseurs_map

# ========================================
# ÉTAPE 2 : CRÉER LES TECHNICIENS
# ========================================
def create_techniciens():
    """Crée les techniciens trouvés dans le CSV des numéros de série"""
    print("\n=== CRÉATION DES TECHNICIENS ===")
    
    techniciens_uniques = {}
    
    # Lire le CSV pour extraire les techniciens
    with open(SERIAL_NUMBERS_CSV, 'r', encoding='utf-8-sig') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            tech_name = row.get('TECH_NAME', '').strip()
            perid = row.get('PERID', '').strip()
            employee = row.get('EMPLOYEE', '').strip()
            
            if tech_name and tech_name != '':
                if tech_name not in techniciens_uniques:
                    techniciens_uniques[tech_name] = {
                        'perid': perid,
                        'employee': employee
                    }
    
    print(f"Trouvé {len(techniciens_uniques)} techniciens uniques")
    
    # Créer les techniciens dans Supabase
    for full_name, info in techniciens_uniques.items():
        try:
            # Séparer prénom et nom
            name_parts = full_name.strip().split(' ', 1)
            prenom = name_parts[0] if len(name_parts) > 0 else ''
            nom = name_parts[1] if len(name_parts) > 1 else name_parts[0]
            
            # Vérifier s'il existe déjà
            existing = supabase.table('personnes').select('id').eq('nom', nom).eq('prenom', prenom).eq('type', 'technicien').execute()
            
            if existing.data:
                tech_id = existing.data[0]['id']
                print(f"✓ Technicien existant: {full_name}")
            else:
                # Créer le nouveau technicien
                data = {
                    'nom': nom,
                    'prenom': prenom,
                    'type': 'technicien',
                    'numero_perid': info['perid'] if info['perid'] else None,
                    'erp_id': info['employee'] if info['employee'] else None,
                }
                result = supabase.table('personnes').insert(data).execute()
                tech_id = result.data[0]['id']
                print(f"✓ Créé: {full_name} (PERID: {info['perid']})")
            
            techniciens_map[full_name] = tech_id
            
        except Exception as e:
            print(f"✗ Erreur pour {full_name}: {e}")
    
    print(f"\n{len(techniciens_map)} techniciens dans la base")
    return techniciens_map

# ========================================
# ÉTAPE 3 : IMPORTER LES ARTICLES
# ========================================
def import_articles():
    """Import des articles depuis ArticlesS30.csv"""
    print("\n=== IMPORT DES ARTICLES ===")
    
    articles_created = 0
    articles_skipped = 0
    articles_errors = 0
    
    with open(ARTICLES_CSV, 'r', encoding='utf-8-sig') as file:
        csv_reader = csv.DictReader(file)
        
        for idx, row in enumerate(csv_reader, 1):
            try:
                # Extraire les données
                barecode = row.get('BARECODE WAREHOUSE', '').strip()
                numero_article = row.get('NUMBER WAREHOUSE', '').strip()
                nom = row.get('NAME_ARTICLE', '').strip()
                fournisseur_nom = row.get('SUPPLIER', '').strip()
                quantite_stock = row.get('QUANTITY STOCK PIECE', '').strip()
                unit = row.get('UNIT', '').strip()
                
                # Skip si pas de données essentielles
                if not barecode or not nom:
                    articles_skipped += 1
                    continue
                
                # Vérifier si l'article existe déjà
                existing = supabase.table('articles').select('id').eq('code_ean', barecode).execute()
                
                if existing.data:
                    articles_skipped += 1
                    continue
                
                # Préparer les données
                fournisseur_id = fournisseurs_map.get(fournisseur_nom) if fournisseur_nom else None
                
                # Convertir la quantité
                try:
                    qty = int(quantite_stock) if quantite_stock and quantite_stock != '' else 0
                except:
                    qty = 0
                
                article_data = {
                    'numero_article': numero_article or f"ART-{idx:04d}",
                    'code_ean': barecode,
                    'nom': nom,
                    'conditionnement': unit or 'Pièce',
                    'fournisseur_id': fournisseur_id,
                    'reference_fournisseur': row.get('NUMBER ARTICLE SUPPLIER', '').strip() or None,
                    'quantite_stock': qty,
                    'stock_minimum': 5,  # Valeur par défaut
                    'stock_maximum': 100,  # Valeur par défaut
                    'point_commande': 10,  # Valeur par défaut
                    'prix_achat': 0,  # À compléter si disponible
                    'prix_vente': 0,  # À compléter si disponible
                    'taux_tva': 21,
                }
                
                # Insérer l'article
                result = supabase.table('articles').insert(article_data).execute()
                article_id = result.data[0]['id']
                articles_map[barecode] = article_id
                articles_created += 1
                
                if articles_created % 50 == 0:
                    print(f"  Importé {articles_created} articles...")
                
            except Exception as e:
                articles_errors += 1
                print(f"✗ Erreur ligne {idx}: {e}")
    
    print(f"\n✓ Articles créés: {articles_created}")
    print(f"  Articles ignorés (déjà existants): {articles_skipped}")
    print(f"  Erreurs: {articles_errors}")
    return articles_map

# ========================================
# ÉTAPE 4 : IMPORTER LES NUMÉROS DE SÉRIE
# ========================================
def import_serial_numbers():
    """Import des numéros de série depuis SerialNumberArticle.csv"""
    print("\n=== IMPORT DES NUMÉROS DE SÉRIE ===")
    
    serials_created = 0
    serials_skipped = 0
    serials_errors = 0
    
    with open(SERIAL_NUMBERS_CSV, 'r', encoding='utf-8-sig') as file:
        csv_reader = csv.DictReader(file)
        
        for idx, row in enumerate(csv_reader, 1):
            try:
                # Extraire les données
                barecode = row.get('BARECODE_WAREHOUSE', '').strip()
                serial_number = row.get('SERIAL_NUMBER_1', '').strip()
                mac_address = row.get('MAC_ADRESSE_1', '').strip()
                localisation = row.get('LOCALISATION', '').strip()
                tech_name = row.get('TECH_NAME', '').strip()
                
                # Skip si pas de numéro de série
                if not serial_number or serial_number == 'Null':
                    serials_skipped += 1
                    continue
                
                # Trouver l'article correspondant
                if barecode not in articles_map:
                    # Chercher dans la base
                    article_result = supabase.table('articles').select('id').eq('code_ean', barecode).execute()
                    if not article_result.data:
                        serials_errors += 1
                        continue
                    article_id = article_result.data[0]['id']
                else:
                    article_id = articles_map[barecode]
                
                # Vérifier si le numéro de série existe déjà
                existing = supabase.table('numeros_serie').select('id').eq('numero_serie', serial_number).execute()
                
                if existing.data:
                    serials_skipped += 1
                    continue
                
                # Préparer les données
                serial_data = {
                    'article_id': article_id,
                    'numero_serie': serial_number,
                    'adresse_mac': mac_address if mac_address else None,
                    'localisation': localisation or 'Warehouse',
                    'statut': 'disponible',
                }
                
                # Insérer le numéro de série
                supabase.table('numeros_serie').insert(serial_data).execute()
                serials_created += 1
                
                if serials_created % 50 == 0:
                    print(f"  Importé {serials_created} numéros de série...")
                
            except Exception as e:
                serials_errors += 1
                if serials_errors <= 10:  # Afficher seulement les 10 premières erreurs
                    print(f"✗ Erreur ligne {idx}: {e}")
    
    print(f"\n✓ Numéros de série créés: {serials_created}")
    print(f"  Numéros ignorés: {serials_skipped}")
    print(f"  Erreurs: {serials_errors}")

# ========================================
# FONCTION PRINCIPALE
# ========================================
def main():
    """Fonction principale d'import"""
    print("╔═══════════════════════════════════════╗")
    print("║   IMPORT DONNÉES VERS SUPABASE        ║")
    print("║   Application SEMACTIVE               ║")
    print("╚═══════════════════════════════════════╝")
    
    # Vérifier que les fichiers existent
    if not os.path.exists(ARTICLES_CSV):
        print(f"✗ Fichier non trouvé: {ARTICLES_CSV}")
        return
    
    if not os.path.exists(SERIAL_NUMBERS_CSV):
        print(f"✗ Fichier non trouvé: {SERIAL_NUMBERS_CSV}")
        return
    
    # Demander confirmation
    print(f"\nFichiers à importer:")
    print(f"  - Articles: {ARTICLES_CSV}")
    print(f"  - Numéros de série: {SERIAL_NUMBERS_CSV}")
    print(f"\nCible: {SUPABASE_URL}")
    
    confirm = input("\nContinuer l'import ? (oui/non): ")
    if confirm.lower() not in ['oui', 'yes', 'o', 'y']:
        print("Import annulé.")
        return
    
    # Exécuter les imports dans l'ordre
    try:
        create_fournisseurs()
        create_techniciens()
        import_articles()
        import_serial_numbers()
        
        print("\n╔═══════════════════════════════════════╗")
        print("║   IMPORT TERMINÉ AVEC SUCCÈS ! ✓      ║")
        print("╚═══════════════════════════════════════╝")
        
    except Exception as e:
        print(f"\n✗ ERREUR CRITIQUE: {e}")
        print("Import interrompu.")

if __name__ == "__main__":
    main()
