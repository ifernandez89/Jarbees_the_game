import os
import struct
import re

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"
SCALE = 0.0254

MAPS = [
    ("fy_pool_day", r"cstrike\maps\fy_pool_day.bsp"),
    ("de_rats3", r"cstrike\maps\de_rats3.bsp"),
    ("de_westwood", r"cstrike\maps\de_westwood.bsp"),
    ("fy_iceworld", r"cstrike\maps\fy_iceworld.bsp"),
]

for name, rel_p in MAPS:
    p = os.path.join(CS_ROOT, rel_p)
    if not os.path.exists(p):
        print(f"NOT FOUND: {p}")
        continue
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
                tx = (coords[0] - cx) * SCALE
                ty = (coords[2] - cz) * SCALE
                tz = -(coords[1] - cy) * SCALE
                ct_spawns.append((tx, ty, tz))
                
        # Textures
        f.seek(lumps[2][0])
        numtex = struct.unpack("<I", f.read(4))[0]
        tex_offsets = [struct.unpack("<i", f.read(4))[0] for _ in range(numtex)]
        embedded = 0
        names = []
        for off in tex_offsets:
            if off >= 0:
                f.seek(lumps[2][0] + off)
                tname, w, h, off0, off1, off2, off3 = struct.unpack("<16sIIIIII", f.read(40))
                clean_name = tname.split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
                names.append(clean_name)
                if off0 > 0:
                    embedded += 1
                    
        print(f"\n{name}:")
        print(f"  Verts: {len(verts)}, Textures: {numtex} ({embedded} embedded)")
        print(f"  Center: cx={cx:.1f}, cy={cy:.1f}, cz={cz:.1f}")
        if ct_spawns:
            sp = ct_spawns[0]
            print(f"  CT Spawn: [{sp[0]:.2f}, {sp[1] + 1.2:.2f}, {sp[2]:.2f}]")
