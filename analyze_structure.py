filepath = '/home/z/my-project/src/app/page.tsx'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Count opening and closing tags between lines 4566-4960
div_depth = 0
fragment_depth = 0
errors = []

for i in range(4565, 4960):  # 0-indexed
    line = lines[i].strip()
    
    # Track fragments
    if line.startswith('<>') or line.startswith('<>'):
        fragment_depth += 1
    if '</>' in line:
        fragment_depth -= 1
    
    # Track divs (simplified)
    import re
    opens = len(re.findall(r'<div[\s>]', line))
    closes = len(re.findall(r'</div>', line))
    div_depth += opens - closes
    
    if div_depth < 0:
        errors.append(f"Line {i+1}: div depth negative ({div_depth}): {line[:60]}")

print(f"Final div depth at end: {div_depth}")
print(f"Final fragment depth at end: {fragment_depth}")
if errors:
    print("Errors found:")
    for e in errors:
        print(f"  {e}")
