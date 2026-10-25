import os
import glob
import re

MAPS_DIR = r"C:\Program Files (x86)\Counter-Strike 1.6\cstrike\maps"

# Look for .txt files that accompany community maps (often have author, credits, history)
community_candidates = []
for txt in glob.glob(os.path.join(MAPS_DIR, "*.txt")):
    bsp = txt.replace(".txt", ".bsp")
    if os.path.exists(bsp):
        name = os.path.basename(bsp)
        try:
            with open(txt, "r", encoding="latin-1", errors="ignore") as f:
                content = f.read(500).strip()
                community_candidates.append((name, os.path.getsize(bsp), content))
        except Exception:
            pass

print(f"Found {len(community_candidates)} maps with .txt descriptions:")
for name, sz, desc in community_candidates:
    print("=" * 60)
    print(f"Map: {name} ({sz // 1024} KB)")
    first_line = desc.split('\n')[0] if desc else 'No text'
    print(f"  Info: {first_line[:100]}")
