import os
import struct
import re

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"
SCALE = 0.0254

MAPS = [
    ("cs_assault", r"cstrike\maps\cs_assault.bsp"),
    ("cs_siege", r"cstrike\maps\cs_siege.bsp"),
    ("de_aztec", r"cstrike\maps\de_aztec.bsp"),
    ("de_chateau", r"cstrike\maps\de_chateau.bsp"),
]

for name, rel_p in MAPS:
    p = os.path.join(CS_ROOT, rel_p)
    with open(p, "rb") as f:
        f.seek(4)
        lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
        
        # Verts
        f.seek(lumps[3][0])
        verts = [struct.unpack("<fff", f.read(12)) for _ in range(lumps[3][1]//12)]
        xs = [v[0] for v in verts]
        ys = [v[1] for v in verts]
        zs = [v[2] for v in verts]
        cx = (min(xs) + max(xs)) * 0.5
        cy = (min(ys) + max(ys)) * 0.5
        cz = min(zs)
        
        # Entities
        f.seek(lumps[0][0])
        ent_str = f.read(lumps[0][1]).decode("latin-1", errors="ignore")
        ct_spawns = []
        for m in re.finditer(r'{\s*([^}]+)\s*}', ent_str):
            body = m.group(1)
            c = re.search(r'"classname"\s*"info_player_start"', body)
            o = re.search(r'"origin"\s*"([^"]+)"', body)
            if c and o:
                coords = [float(x) for x in o.group(1).split()]
                # Convert to Three.js coordinates
                tx = (coords[0] - cx) * SCALE
                ty = (coords[2] - cz) * SCALE
                tz = -(coords[1] - cy) * SCALE
                ct_spawns.append((tx, ty, tz))
                
        print(f"\n{name}:")
        print(f"  Bounds: X[{min(xs):.0f}, {max(xs):.0f}], Y[{min(ys):.0f}, {max(ys):.0f}], Z[{min(zs):.0f}, {max(zs):.0f}]")
        print(f"  Center: cx={cx:.1f}, cy={cy:.1f}, cz={cz:.1f}")
        if ct_spawns:
            first = ct_spawns[0]
            print(f"  First CT spawn Three.js: [{first[0]:.2f}, {first[1]:.2f}, {first[2]:.2f}]")
            # Elevated by 1.2m so Auren lands gracefully
            print(f"  Spawn pos (elevated): [{first[0]:.2f}, {first[1] + 1.2:.2f}, {first[2]:.2f}]")
