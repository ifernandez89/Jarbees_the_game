import struct
import os
import re

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"
MAPS_DIR = os.path.join(CS_ROOT, r"cstrike\maps")
maps = ["cs_siege.bsp", "de_aztec_cz.bsp", "de_chateau.bsp"]

for m in maps:
    p = os.path.join(MAPS_DIR, m)
    if not os.path.exists(p):
        print(f"Map {m} not found!")
        continue
    with open(p, "rb") as f:
        lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
        f.seek(lumps[0][0])
        ents = f.read(lumps[0][1]).decode("latin-1", errors="ignore")
        wads = re.search(r'"wad"\s+"([^"]+)"', ents)
        print(f"=== {m} ===")
        if wads:
            print("  WADs referenced:", wads.group(1))
        
        # Check texture names in lump 2
        f.seek(lumps[2][0])
        numtex = struct.unpack("<I", f.read(4))[0]
        tex_offsets = [struct.unpack("<i", f.read(4))[0] for _ in range(numtex)]
        t_names = []
        for off in tex_offsets:
            if off >= 0:
                f.seek(lumps[2][0] + off)
                name = f.read(16).split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
                t_names.append(name)
        print(f"  Total textures in Lump 2: {len(t_names)}")
        
        # Check vertices bounds
        f.seek(lumps[3][0])
        verts = [struct.unpack("<fff", f.read(12)) for _ in range(lumps[3][1]//12)]
        xs = [v[0] for v in verts]
        ys = [v[1] for v in verts]
        zs = [v[2] for v in verts]
        print(f"  Bounds: X:[{min(xs)}, {max(xs)}] Y:[{min(ys)}, {max(ys)}] Z:[{min(zs)}, {max(zs)}]")
        
        # Find player spawn
        blocks = re.findall(r"\{([^}]+)\}", ents)
        for b in blocks:
            if "info_player_start" in b:
                orig = re.search(r'"origin"\s+"([^"]+)"', b)
                if orig:
                    print("  CT Spawn (GoldSrc):", orig.group(1))
                    break
        for b in blocks:
            if "info_player_deathmatch" in b:
                orig = re.search(r'"origin"\s+"([^"]+)"', b)
                if orig:
                    print("  T Spawn (GoldSrc):", orig.group(1))
                    break
