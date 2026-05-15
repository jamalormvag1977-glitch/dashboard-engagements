#!/bin/bash
# ========================================
# Script de sauvegarde/restauration des données du dashboard
# Usage:
#   ./backup-restore.sh backup    - Créer une sauvegarde
#   ./backup-restore.sh restore   - Restaurer la dernière sauvegarde
#   ./backup-restore.sh list      - Lister les sauvegardes
#   ./backup-restore.sh verify    - Vérifier l'intégrité des données actuelles
# ========================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_FILE="$PROJECT_DIR/data/dashboard-data.json"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

mkdir -p "$BACKUP_DIR"

backup() {
    if [ ! -f "$DATA_FILE" ]; then
        echo -e "${RED}Erreur: Fichier de données introuvable: $DATA_FILE${NC}"
        exit 1
    fi

    BACKUP_FILE="$BACKUP_DIR/dashboard-data-$TIMESTAMP.json"
    cp "$DATA_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✓ Sauvegarde créée: $BACKUP_FILE${NC}"

    # Also save a "latest" copy for easy restore
    cp "$DATA_FILE" "$BACKUP_DIR/dashboard-data-latest.json"
    echo -e "${GREEN}✓ Copie 'latest' mise à jour${NC}"

    # Show backup size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${BLUE}Taille: $SIZE${NC}"

    # Keep only last 10 backups (excluding latest)
    ls -t "$BACKUP_DIR"/dashboard-data-2*.json 2>/dev/null | tail -n +11 | xargs -r rm
    echo -e "${BLUE}Nettoyage: seules les 10 dernières sauvegardes sont conservées${NC}"
}

restore() {
    if [ -z "$1" ]; then
        # Restore from latest
        RESTORE_FILE="$BACKUP_DIR/dashboard-data-latest.json"
    else
        RESTORE_FILE="$1"
    fi

    if [ ! -f "$RESTORE_FILE" ]; then
        echo -e "${RED}Erreur: Fichier de sauvegarde introuvable: $RESTORE_FILE${NC}"
        list
        exit 1
    fi

    # Backup current data before overwriting
    if [ -f "$DATA_FILE" ]; then
        PRE_BACKUP="$BACKUP_DIR/pre-restore-$TIMESTAMP.json"
        cp "$DATA_FILE" "$PRE_BACKUP"
        echo -e "${YELLOW}⚠ Sauvegarde pré-restauration créée: $PRE_BACKUP${NC}"
    fi

    cp "$RESTORE_FILE" "$DATA_FILE"

    # Also copy to standalone location
    STANDALONE_DIR="$PROJECT_DIR/.next/standalone/data"
    if [ -d "$STANDALONE_DIR" ]; then
        cp "$RESTORE_FILE" "$STANDALONE_DIR/dashboard-data.json"
        echo -e "${GREEN}✓ Données restaurées (y compris standalone)${NC}"
    else
        echo -e "${GREEN}✓ Données restaurées: $DATA_FILE${NC}"
    fi

    # Restart PM2
    cd "$PROJECT_DIR"
    npx pm2 restart nextjs-dashboard 2>/dev/null && echo -e "${GREEN}✓ Dashboard redémarré${NC}"
}

list() {
    echo -e "${BLUE}Sauvegardes disponibles:${NC}"
    ls -lht "$BACKUP_DIR"/dashboard-data-2*.json 2>/dev/null || echo -e "${YELLOW}Aucune sauvegarde trouvée${NC}"
}

verify() {
    if [ ! -f "$DATA_FILE" ]; then
        echo -e "${RED}✗ Fichier de données introuvable!${NC}"
        exit 1
    fi

    echo -e "${BLUE}Vérification des données...${NC}"

    # Check if JSON is valid
    python3 -c "
import json, sys
try:
    with open('$DATA_FILE', 'r') as f:
        data = json.load(f)
    rows = data.get('data', [])
    print(f'  Lignes: {len(rows)}')

    if not rows:
        print('  ⚠ Aucune donnée!')
        sys.exit(1)

    # Check required columns
    row = rows[0]
    required = ['Programme', 'Projet', 'ENTITE', 'SOURCE FINANCEMENT', 'TOTAL CP', 'ENG CP TOTAL', 'ORD TOTAL', 'PAIEMENTS TOTAL']
    missing = [f for f in required if f not in row]
    if missing:
        print(f'  ✗ Colonnes manquantes: {missing}')
        sys.exit(1)
    else:
        print(f'  ✓ Toutes les colonnes requises présentes')

    # Check Projet field
    has_projet = all(row.get('Projet') for row in rows)
    print(f'  {\"✓\" if has_projet else \"✗\"} Champ Projet: {\"OK\" if has_projet else \"MANQUANT dans certaines lignes\"} ')

    # Check numeric fields
    numeric_ok = True
    for row in rows[:5]:
        for field in ['TOTAL CP', 'ENG CP TOTAL', 'ORD TOTAL', 'PAIEMENTS TOTAL']:
            if row.get(field) is None:
                numeric_ok = False
                print(f'  ✗ Champ {field} est null')
    if numeric_ok:
        print('  ✓ Champs numériques OK')

    # Count unique values
    programmes = set(row.get('Programme','') for row in rows)
    projets = set(row.get('Projet','') for row in rows)
    entites = set(row.get('ENTITE','') for row in rows)
    sources = set(row.get('SOURCE FINANCEMENT','') for row in rows)
    print(f'  Programmes: {len(programmes)}, Projets: {len(projets)}, Entités: {len(entites)}, Sources: {len(sources)}')

    print('  ✓ Données valides!')
except json.JSONDecodeError:
    print('  ✗ Fichier JSON invalide!')
    sys.exit(1)
except Exception as e:
    print(f'  ✗ Erreur: {e}')
    sys.exit(1)
"
}

case "$1" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    list)
        list
        ;;
    verify)
        verify
        ;;
    *)
        echo "Usage: $0 {backup|restore|list|verify}"
        echo ""
        echo "  backup   - Créer une sauvegarde des données actuelles"
        echo "  restore  - Restaurer la dernière sauvegarde (ou spécifier un fichier)"
        echo "  list     - Lister les sauvegardes disponibles"
        echo "  verify   - Vérifier l'intégrité des données actuelles"
        exit 1
        ;;
esac
