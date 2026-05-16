filepath = '/home/z/my-project/src/app/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

import re

# Check overall balance of JSX tags
opens = len(re.findall(r'<div[\s>]', content))
closes = len(re.findall(r'</div>', content))
fragments_open = len(re.findall(r'<>|<React.Fragment>', content))
fragments_close = len(re.findall(r'</>|</React.Fragment>', content))

print(f"<div> opens: {opens}")
print(f"</div> closes: {closes}")
print(f"Balance: {opens - closes}")
print(f"Fragments open: {fragments_open}")
print(f"Fragments close: {fragments_close}")
print(f"Fragment balance: {fragments_open - fragments_close}")

# Check Card balance
card_opens = len(re.findall(r'<Card[\s>]', content))
card_closes = len(re.findall(r'</Card>', content))
print(f"<Card> opens: {card_opens}")
print(f"</Card> closes: {card_closes}")
print(f"Card balance: {card_opens - card_closes}")

# Check CardHeader balance
header_opens = len(re.findall(r'<CardHeader', content))
header_closes = len(re.findall(r'</CardHeader>', content))
print(f"<CardHeader> opens: {header_opens}")
print(f"</CardHeader> closes: {header_closes}")

# Check CardContent balance
content_opens = len(re.findall(r'<CardContent', content))
content_closes = len(re.findall(r'</CardContent>', content))
print(f"<CardContent> opens: {content_opens}")
print(f"</CardContent> closes: {content_closes}")
