import os
import struct
import re

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"
MAPS = ['cs_assault', 'cs_siege', 'de_aztec_cz', 'de_chateau']

for m in MAPS:
    p = os.path.join(CS_ROOT, f"cstrike\\maps\\{m}.bsp")
    with open(p, 'rb') as f:
        f.seek(4)
        ofs, sz = struct.unpack('<II', f.read(8))
        f.seek(ofs)
        s = f.read(sz).decode('latin-1', errors='ignore')
        w = re.search(r'"wad"\s*"([^"]+)"', s)
        print(f"\n{m}:")
        if w:
            wads = [x.strip() for x in w.group(1).split(';') if x.strip()]
            for item in wads:
                print(f"  {item}")
        else:
            print("  No wad key")
