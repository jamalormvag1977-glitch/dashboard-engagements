import re

filepath = '/home/z/my-project/src/app/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# ══════════════════════════════════════════════════════════
# 1. REPLACE ALL CARD BORDERS WITH BLUE-800
# ══════════════════════════════════════════════════════════

# Card with bg-white + border + shadow-md + overflow-hidden (entity/proj/prog bar chart cards)
content = content.replace(
    'bg-white border border-gray-100 shadow-md overflow-hidden',
    'bg-white border-2 border-blue-800 shadow-md overflow-hidden'
)

# Card with bg-white + border + shadow-md + hover + rounded-2xl (overview trésorerie/subvention)
content = content.replace(
    'bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden rounded-2xl',
    'bg-white border-2 border-blue-800 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden rounded-2xl'
)

# Standard Card with border shadow-sm (most cards)
content = content.replace(
    'border border-gray-100 shadow-sm',
    'border-2 border-blue-800 shadow-sm'
)

# Standard Card with border shadow-sm overflow-hidden (gauge cards)
content = content.replace(
    'border-2 border-blue-800 shadow-sm overflow-hidden',
    'border-2 border-blue-800 shadow-sm overflow-hidden'
)

# ══════════════════════════════════════════════════════════
# 2. ADD BLUE BACKGROUND TO ALL CARDHEADER
# ══════════════════════════════════════════════════════════

# Standard CardHeader
content = content.replace(
    '<CardHeader className="pb-3">',
    '<CardHeader className="pb-3 bg-blue-50/50 border-b border-blue-200">'
)

# Special CardHeader with gradient (prévisions par entité in overview)
content = content.replace(
    '<CardHeader className="pb-3 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 border-b border-teal-100/50">',
    '<CardHeader className="pb-3 bg-blue-50/50 border-b border-blue-200">'
)

# Gauge card CardHeader
content = content.replace(
    '<CardHeader className="pb-1 pt-3 px-4">',
    '<CardHeader className="pb-1 pt-3 px-4 bg-blue-50/50 border-b border-blue-200">'
)

# ══════════════════════════════════════════════════════════
# 3. REPLACE ALL MAIN TITLE COLORS WITH BLUE-900
# ══════════════════════════════════════════════════════════

# h3 titles with text-gray-800
content = content.replace(
    'text-sm font-bold text-gray-800 tracking-wide uppercase',
    'text-sm font-bold text-blue-900 tracking-wide uppercase'
)

# h4 titles with text-gray-700
content = content.replace(
    'text-sm font-bold text-gray-700 uppercase tracking-wide',
    'text-sm font-bold text-blue-900 uppercase tracking-wide'
)

# CardTitle with text-gray-800
content = content.replace(
    'text-sm font-bold text-gray-800 tracking-wide uppercase',
    'text-sm font-bold text-blue-900 tracking-wide uppercase'
)

# h2 title (Paramètres)
content = content.replace(
    'text-lg font-bold text-gray-900 tracking-wide uppercase',
    'text-lg font-bold text-blue-900 tracking-wide uppercase'
)

# Small CardTitle (gauge cards - Total CP etc.) - these are sub-titles, keep as is
# Actually, let me also change these for consistency
content = content.replace(
    'text-xs font-bold text-gray-600 uppercase tracking-wider',
    'text-xs font-bold text-blue-900 uppercase tracking-wider'
)

# ══════════════════════════════════════════════════════════
# 4. ADD BLUE HEADER TO BAR CHART CARDS (entity/proj/prog)
# ══════════════════════════════════════════════════════════

# Entity bar chart header
content = content.replace(
    '<div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-gray-100">\n              <BarChart3 className="w-5 h-5 text-gray-800" />\n              <h4 className=',
    '<div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-blue-200 bg-blue-50/50">\n              <h4 className='
)

# Projet bar chart header (same pattern, after entity one is already replaced)
# The remaining BarChart3 header lines (projet and programme)
content = content.replace(
    '<div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-gray-100">\n              <BarChart3 className="w-5 h-5 text-gray-800" />',
    '<div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-blue-200 bg-blue-50/50">'
)

# Programme bar chart already has the blue header from earlier edit, but update padding
content = content.replace(
    '<div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-blue-200 bg-blue-50/50">\n              <BarChart3 className=',
    '<div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-blue-200 bg-blue-50/50">'
)

# ══════════════════════════════════════════════════════════
# 5. REMOVE COLORED BARS NEXT TO SECTION TITLES (h3)
# ══════════════════════════════════════════════════════════

# Remove the small vertical colored bar divs before h3 titles
# Pattern: <div className="w-1 h-5 rounded-full bg-gradient-to-b ..." /> before h3 titles
content = re.sub(
    r'<div className="w-1 h-5 rounded-full bg-gradient-to-b[^"]*"\s*/>\s*\n(\s*)<h3',
    r'<h3',
    content
)

# Also handle the div wrapper: <div className="flex items-center gap-2">\n<div.../>\n<h3...
# Replace the wrapper div + inner div with just the h3
content = re.sub(
    r'<div className="flex items-center gap-2">\s*\n\s*<h3',
    r'<h3',
    content
)

# Remove closing </div> for the flex wrapper (match the one that was wrapping just the bar + h3)
# This is tricky - let me handle specific cases

# ══════════════════════════════════════════════════════════
# 6. ADD NUMBERING TO ALL MAIN SECTION TITLES PER VIEW
# ══════════════════════════════════════════════════════════

# Define all numbering replacements per view
# Format: (old_string, new_string)

numbering_replacements = [
    # ─── renderOverview ───
    # 1. Trésorerie et subvention
    (
        '>Trésorerie et subvention</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-5">1.</span>Trésorerie et subvention</h3>'
    ),
    # 2. Performance Globale
    (
        '>Performance Globale</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-5">2.</span>Performance Globale</h3>'
    ),
    # 3. Crédits
    (
        '>Crédits</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-5">3.</span>Crédits</h3>'
    ),
    # 4. Engagements
    (
        '>Engagements</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-5">4.</span>Engagements</h3>'
    ),
    # 5. Ordonnancement
    (
        '>Ordonnancement</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-5">5.</span>Ordonnancement</h3>'
    ),
    # 6. Paiements
    (
        '>Paiements</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-5">6.</span>Paiements</h3>'
    ),
    # 7. Prévisions d'ordonnancement cumulées (overview)
    (
        ">Prévisions d&apos;ordonnancement cumulées</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-5\">7.</span>Prévisions d&apos;ordonnancement cumulées</h3>"
    ),
    # 8. État d'avancement par programme (overview)
    (
        ">État d&#39;avancement par programme</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-5\">8.</span>État d&#39;avancement par programme</h3>"
    ),
    # 9. État d'avancement par projet (overview)
    (
        ">État d&#39;avancement par projet</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-5\">9.</span>État d&#39;avancement par projet</h3>"
    ),
    # 10. État d'avancement par entité (overview)
    (
        ">État d&#39;avancement par entité</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-5\">10.</span>État d&#39;avancement par entité</h3>"
    ),
    # 11. Prévisions d'ordonnancement cumulées par entité (overview CardTitle)
    (
        ">Prévisions d&apos;ordonnancement cumulées par entité</CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-5\">11.</span>Prévisions d&apos;ordonnancement cumulées par entité</CardTitle>"
    ),

    # ─── renderEntityView ───
    # 1. Répartition des crédits par entité
    (
        '>Répartition des crédits par entité</h4>',
        '><span className="text-blue-900 mr-2 inline-block w-6">1.</span>Répartition des crédits par entité</h4>'
    ),
    # 2. Indicateurs par entité
    (
        '>Indicateurs par entité</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-6">2.</span>Indicateurs par entité</h3>'
    ),
    # 3. Détail par entité
    (
        '>Détail par entité <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">3.</span>Détail par entité <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>'
    ),

    # ─── renderProgramView (Par projet) ───
    # 1. Répartition des crédits par projet
    (
        '>Répartition des crédits par projet</h4>',
        '><span className="text-blue-900 mr-2 inline-block w-6">1.</span>Répartition des crédits par projet</h4>'
    ),
    # 2. Détail par projet
    (
        '>Détail par projet</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">2.</span>Détail par projet</CardTitle>'
    ),

    # ─── renderProjectView (Par programme) - already numbered, update format ───
    # 1. Already has <span className="text-blue-900 mr-2 inline-block w-5">1.</span>
    # 2. Already has numbering
    # 3. Already has numbering
    # These are already done, so skip

    # ─── renderEngagementsView ───
    # 1. Engagements par Programme
    (
        '>Engagements par Programme</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">1.</span>Engagements par Programme</CardTitle>'
    ),
    # 2. Engagements par Projet
    (
        '>Engagements par Projet</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">2.</span>Engagements par Projet</CardTitle>'
    ),
    # 3. Engagements par Entité
    (
        '>Engagements par Entité</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">3.</span>Engagements par Entité</CardTitle>'
    ),
    # 4. Détail des engagements
    (
        '>Détail des engagements <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">4.</span>Détail des engagements <span className="text-gray-400 font-normal">(MDh)</span></CardTitle>'
    ),

    # ─── renderOrdonnancementsView ───
    # 1. Ordonnancement par programme
    (
        ">Ordonnancement par programme <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">1.</span>Ordonnancement par programme <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),
    # 2. Ordonnancement par projet
    (
        ">Ordonnancement par projet <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">2.</span>Ordonnancement par projet <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),
    # 3. Ordonnancement par entité
    (
        ">Ordonnancement par entité <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">3.</span>Ordonnancement par entité <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),
    # 4. Détail des ordonnancements
    (
        ">Détail des ordonnancements <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">4.</span>Détail des ordonnancements <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),

    # ─── renderReportsView ───
    # 1. Synthèse générale
    (
        '>Synthèse générale</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-6">1.</span>Synthèse générale</h3>'
    ),
    # 2. Résumé comparatif par entité
    (
        '>Résumé comparatif par entité</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">2.</span>Résumé comparatif par entité</CardTitle>'
    ),
    # 3. Structure budgétaire
    (
        ">Structure budgétaire\n            </CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">3.</span>Structure budgétaire\n            </CardTitle>"
    ),
    # 4. Source de financement
    (
        '>Source de financement</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">4.</span>Source de financement</CardTitle>'
    ),

    # ─── renderPrevisionsView ───
    # 1. Prévisions d'ordonnancement cumulées
    (
        ">Prévisions d'ordonnancement cumulées</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">1.</span>Prévisions d'ordonnancement cumulées</h3>"
    ),
    # 2. Prévisions cumulées par programme
    (
        ">Prévisions cumulées par programme <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">2.</span>Prévisions cumulées par programme <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),
    # 3. Prévisions cumulées par projet
    (
        ">Prévisions cumulées par projet <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">3.</span>Prévisions cumulées par projet <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),
    # 4. Prévisions cumulées par entité
    (
        ">Prévisions cumulées par entité <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">4.</span>Prévisions cumulées par entité <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),
    # 5. Détail des prévisions par prestation
    (
        ">Détail des prévisions par prestation <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">5.</span>Détail des prévisions par prestation <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),

    # ─── renderAssainissementView ───
    # 1. Reports
    (
        '>Reports</h3>',
        '><span className="text-blue-900 mr-2 inline-block w-6">1.</span>Reports</h3>'
    ),
    # 2. Taux d'assainissement
    (
        ">Taux d&apos;assainissement</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">2.</span>Taux d&apos;assainissement</h3>"
    ),
    # 3. Assainissement par entité
    (
        '>Assainissement par entité</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">3.</span>Assainissement par entité</CardTitle>'
    ),
    # 4. Assainissement par projet
    (
        '>Assainissement par projet</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6\">4.</span>Assainissement par projet</CardTitle>'
    ),
    # 5. Assainissement par programme
    (
        '>Assainissement par programme</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6\">5.</span>Assainissement par programme</CardTitle>'
    ),
    # 6. Détail des assainissement par prestation
    (
        ">Détail des assainissement par prestation <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">6.</span>Détail des assainissement par prestation <span className=\"text-gray-400 font-normal\">(MDh)</span></CardTitle>"
    ),

    # ─── renderSettingsView ───
    # 1. Paramètres
    (
        '>Paramètres</h2>',
        '><span className="text-blue-900 mr-2 inline-block w-6">1.</span>Paramètres</h2>'
    ),
    # 2. Actualisation automatique
    (
        ">Actualisation automatique\n            </CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">2.</span>Actualisation automatique\n            </CardTitle>"
    ),
    # 3. Préférences d'affichage
    (
        ">Préférences d&apos;affichage\n            </CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">3.</span>Préférences d&apos;affichage\n            </CardTitle>"
    ),
    # 4. Gestion des données
    (
        ">Gestion des données\n            </CardTitle>",
        "><span className=\"text-blue-900 mr-2 inline-block w-6\">4.</span>Gestion des données\n            </CardTitle>"
    ),
    # 5. À propos
    (
        '>À propos</CardTitle>',
        '><span className="text-blue-900 mr-2 inline-block w-6">5.</span>À propos</CardTitle>'
    ),
]

for old, new in numbering_replacements:
    if old in content:
        content = content.replace(old, new, 1)  # Replace only first occurrence
    else:
        print(f"WARNING: Could not find: {old[:80]}...")

with open(filepath, 'w') as f:
    f.write(content)

print("All replacements done!")
