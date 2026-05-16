filepath = '/home/z/my-project/src/app/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# The issue: after removing <div className="flex items-center gap-2"> wrappers,
# orphaned </div> tags remain right after the h3 titles.
# Pattern: </h3>\n        </div>  (or similar whitespace)
# These orphaned </div> need to be removed.

import re

# Pattern: after a numbered h3, there's an orphaned </div> on the next line
# The original structure was:
#   <div className="flex items-center gap-2">
#     <div className="w-1 h-5 rounded-full..." />
#     <h3>Title</h3>
#   </div>           ← this is now orphaned
#
# After the regex, it became:
#   <h3>Title</h3>
#   </div>           ← orphaned, needs to be removed

# But we need to be careful not to remove legitimate </div> tags.
# The orphaned ones appear right after </h3> with just whitespace between.

# Let me look for the specific pattern: </h3> followed by </div> on next line
# with only whitespace in between, where the h3 has our numbering span

orphan_pattern = re.compile(
    r'(</h3>)\s*\n(\s*)</div>',
    re.MULTILINE
)

# We need to check each match to see if it's truly orphaned
# The orphaned ones are in sections where the <div className="flex items-center gap-2"> was removed
# Let's count them and identify which ones to remove

lines = content.split('\n')
result_lines = []
skip_next_div_close = False

for i, line in enumerate(lines):
    if skip_next_div_close:
        stripped = line.strip()
        if stripped == '</div>':
            # Skip this orphaned </div>
            skip_next_div_close = False
            continue
        else:
            skip_next_div_close = False
    
    # Check if this line has a numbered h3 that was wrapped in <div className="flex items-center gap-2">
    # These are section titles like: <h3 ...>1.Trésorerie...</h3> or <h3 ...>2.Performance...</h3>
    if '<h3 className="text-sm font-bold text-blue-900' in line:
        # Check if the next line is just </div> (orphaned)
        if i + 1 < len(lines) and lines[i + 1].strip() == '</div>':
            # Check that this is NOT inside a CardHeader (which has legitimate </div>)
            # Look backwards for CardHeader context
            context = '\n'.join(lines[max(0, i-5):i])
            if 'CardHeader' not in context:
                skip_next_div_close = True
    
    result_lines.append(line)

content = '\n'.join(result_lines)

with open(filepath, 'w') as f:
    f.write(content)

print("Orphaned </div> removal done!")
print(f"Lines before: {len(lines)}, after: {len(result_lines)}")
