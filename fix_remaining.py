filepath = '/home/z/my-project/src/app/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

replacements = [
    # Overview: État d'avancement par programme (line 2082)
    (
        ">État d'avancement par programme</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-5\">8.</span>État d'avancement par programme</h3>"
    ),
    # Overview: État d'avancement par projet (line 2146)
    (
        ">État d'avancement par projet</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-5\">9.</span>État d'avancement par projet</h3>"
    ),
    # Overview: État d'avancement par entité (line 2210)
    (
        ">État d'avancement par entité</h3>",
        "><span className=\"text-blue-900 mr-2 inline-block w-5\">10.</span>État d'avancement par entité</h3>"
    ),
    # Reports: Structure budgétaire (multi-line CardTitle)
    (
        "              <BarChart3 className=\"w-4 h-4\" />\n              Structure budgétaire",
        "              <BarChart3 className=\"w-4 h-4\" />\n              <span className=\"text-blue-900 mr-2 inline-block w-6\">3.</span>Structure budgétaire"
    ),
    # Settings: Actualisation automatique (multi-line CardTitle)
    (
        "              <Zap className=\"w-4 h-4\" />\n              Actualisation automatique",
        "              <Zap className=\"w-4 h-4\" />\n              <span className=\"text-blue-900 mr-2 inline-block w-6\">2.</span>Actualisation automatique"
    ),
    # Settings: Préférences d'affichage
    (
        "              <BarChart3 className=\"w-4 h-4\" />\n              Préférences d&apos;affichage",
        "              <BarChart3 className=\"w-4 h-4\" />\n              <span className=\"text-blue-900 mr-2 inline-block w-6\">3.</span>Préférences d&apos;affichage"
    ),
    # Settings: Gestion des données
    (
        "              <Database className=\"w-4 h-4\" />\n              Gestion des données",
        "              <Database className=\"w-4 h-4\" />\n              <span className=\"text-blue-900 mr-2 inline-block w-6\">4.</span>Gestion des données"
    ),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new, 1)
        print(f"OK: {old[:60]}...")
    else:
        print(f"MISSING: {old[:60]}...")

with open(filepath, 'w') as f:
    f.write(content)

print("Fix done!")
