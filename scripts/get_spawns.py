import re

SCALE = 0.0254
cx = -720.0
cy = 1024.0
cz = -48.0

p = r"C:\Program Files (x86)\Counter-Strike 1.6\cstrike\maps\cs_assault.bsp"
with open(p, "rb") as f:
    f.seek(1017804)
    ents = f.read(15883).decode("latin-1", errors="ignore")

def to_three(x, y, z):
    bx = (x - cx) * SCALE
    by = (y - cy) * SCALE
    bz = (z - cz) * SCALE
    return round(bx, 2), round(bz, 2), round(-by, 2)

blocks = re.findall(r"\{([^}]+)\}", ents)
for b in blocks:
    if "info_player_start" in b:
        orig = re.search(r'"origin"\s+"([^"]+)"', b)
        if orig:
            ox, oy, oz = [float(v) for v in orig.group(1).split()]
            print("CT Spawn:", to_three(ox, oy, oz))
            break

for b in blocks:
    if "info_player_deathmatch" in b:
        orig = re.search(r'"origin"\s+"([^"]+)"', b)
        if orig:
            ox, oy, oz = [float(v) for v in orig.group(1).split()]
            print("Terrorist Spawn:", to_three(ox, oy, oz))
            break

for b in blocks:
    if "hostage_entity" in b:
        orig = re.search(r'"origin"\s+"([^"]+)"', b)
        if orig:
            ox, oy, oz = [float(v) for v in orig.group(1).split()]
            print("Hostage Location:", to_three(ox, oy, oz))
            break
