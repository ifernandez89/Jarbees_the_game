import os
import struct
import re

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"

for m in ['de_rats3', 'de_westwood', 'fy_iceworld']:
    p = os.path.join(CS_ROOT, f"cstrike\\maps\\{m}.bsp")
    with open(p, 'rb') as f:
        f.seek(4)
        ofs, sz = struct.unpack('<II', f.read(8))
        f.seek(ofs)
        s = f.read(sz).decode('latin-1', errors='ignore')
        w = re.search(r'"wad"\s*"([^"]+)"', s)
        print(f"\n{m}:")
        if w:
            for item in w.group(1).split(';'):
                if item.strip():
                    print("  ", item.strip())
        else:
            print("  No wad key")
