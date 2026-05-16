filepath = '/home/z/my-project/src/app/page.tsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Find patterns where after a section h3 title, there's an orphaned </div>
# The original structure was:
#   <div className="space-y-3">
#     <div className="flex items-center gap-2">
#       <div className="w-1 h-5 ..." />
#       <h3>Title</h3>
#     </div>        ← orphaned
#     <div className="grid ...">

# After regex: 
#   <div className="space-y-3">
#     <h3>Title</h3>
#       </div>      ← orphaned, needs removal
#     <div className="grid ...">

# Strategy: Find all lines with </h3> or <h3>...</h3> that have numbering spans
# Then check if the next non-empty line is </div> and it's orphaned

result = []
i = 0
removed = 0

while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    
    # Check if this line contains a numbered h3 title
    if '<h3' in line and 'text-blue-900' in line and ('inline-block' in line or '</h3>' in line):
        result.append(line)
        i += 1
        
        # Look ahead for orphaned </div>
        while i < len(lines) and lines[i].strip() == '':
            result.append(lines[i])
            i += 1
        
        if i < len(lines) and lines[i].strip() == '</div>':
            # Check if this is an orphaned div from the removed wrapper
            # Look at what comes after to confirm it's not a legitimate closing
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                j += 1
            
            if j < len(lines):
                next_content = lines[j].strip()
                # If next content is a new div, grid, or comment, this </div> is orphaned
                if next_content.startswith('<div') or next_content.startswith('{/*'):
                    print(f"Removing orphaned </div> at line {i+1}: after h3, before: {next_content[:50]}")
                    removed += 1
                    i += 1  # Skip the orphaned </div>
                    continue
        
        continue
    
    result.append(line)
    i += 1

print(f"Total orphaned </div> removed: {removed}")

with open(filepath, 'w') as f:
    f.writelines(result)
