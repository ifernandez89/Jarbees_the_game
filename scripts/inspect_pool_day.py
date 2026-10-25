import os
import struct
import re

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"
SCALE = 0.0254

p = os.path.join(CS_ROOT, r"cstrike\maps\fy_pool_day.bsp")
with open(p, "rb") as f:
    f.seek(4)
    lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
    f.seek(lumps[3][0])
    verts = [struct.unpack("<fff", f.read(12)) for _ in range(lumps[3][1]//12)]
    xs = [v[0] for v in verts]
    ys = [v[1] for v in verts]
    zs = [v[2] for v in verts]
    cx = (min(xs) + max(xs)) * 0.5
    cy = (min(ys) + max(ys)) * 0.5
    cz = min(zs)
    
    f.seek(lumps[0][0])
    ent_str = f.read(lumps[0][1]).decode("latin-1", errors="ignore")
    ct_spawns = []
    for m in re.finditer(r'{\s*([^}]+)\s*}', ent_str):
        body = m.group(1)
        c = re.search(r'"classname"\s*"info_player_start"', body)
        o = re.search(r'"origin"\s*"([^"]+)"', body)
        if c and o:
            coords = [float(x) for x in o.group(1).split()]
            tx = (coords[0] - cx) * SCALE
            ty = (coords[2] - cz) * SCALE
            tz = -(coords[1] - cy) * SCALE
            ct_spawns.append((tx, ty, tz))

print(f"fy_pool_day:")
print(f"  Verts: {len(verts)}, Bounds X[{min(xs):.0f}, {max(xs):.0f}], Y[{min(ys):.0f}, {max(ys):.0f}], Z[{min(zs):.0f}, {max(zs):.0f}]")
if ct_spawns:
    print(f"  First CT spawn Three.js: [{ct_spawns[0][0]:.2f}, {ct_spawns[0][1] + 1.2:.2f}, {ct_spawns[0][2]:.2f}]")
