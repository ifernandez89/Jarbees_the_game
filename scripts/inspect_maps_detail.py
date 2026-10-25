import os
import struct
import re

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"
MAPS = [
    ("cs_assault", os.path.join(CS_ROOT, r"cstrike\maps\cs_assault.bsp")),
    ("cs_siege", os.path.join(CS_ROOT, r"cstrike\maps\cs_siege.bsp")),
    ("de_aztec_cz", os.path.join(CS_ROOT, r"cstrike\maps\de_aztec_cz.bsp")),
    ("de_chateau", os.path.join(CS_ROOT, r"cstrike\maps\de_chateau.bsp")),
]

def inspect_map(name, path):
    if not os.path.exists(path):
        print(f"NOT FOUND: {path}")
        return
    with open(path, "rb") as f:
        ver = struct.unpack("<I", f.read(4))[0]
        lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
        
        # Entity lump is lump 0
        f.seek(lumps[0][0])
        ent_str = f.read(lumps[0][1]).decode("latin-1", errors="ignore")
        
        # Find player spawns
        # CT spawn: info_player_start
        # T spawn: info_player_deathmatch
        ct_spawns = []
        t_spawns = []
        for m in re.finditer(r'{\s*([^}]+)\s*}', ent_str):
            ent_body = m.group(1)
            classname = re.search(r'"classname"\s*"([^"]+)"', ent_body)
            origin = re.search(r'"origin"\s*"([^"]+)"', ent_body)
            if classname and origin:
                cname = classname.group(1)
                coords = [float(x) for x in origin.group(1).split()]
                if cname == "info_player_start":
                    ct_spawns.append(coords)
                elif cname == "info_player_deathmatch":
                    t_spawns.append(coords)
        
        # Texture lump is lump 2
        f.seek(lumps[2][0])
        numtex = struct.unpack("<I", f.read(4))[0]
        tex_offsets = [struct.unpack("<i", f.read(4))[0] for _ in range(numtex)]
        embedded_count = 0
        tex_names = []
        for off in tex_offsets:
            if off >= 0:
                f.seek(lumps[2][0] + off)
                tname = f.read(16).split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
                w, h, off0, off1, off2, off3 = struct.unpack("<IIIIII", f.read(24))
                if off0 > 0:
                    embedded_count += 1
                tex_names.append(tname)
                
        # Vertices lump 3
        num_verts = lumps[3][1] // 12
        num_faces = lumps[7][1] // 20
        
        print(f"\nMap: {name} (v{ver})")
        print(f"  Verts: {num_verts}, Faces: {num_faces}")
        print(f"  Textures: {numtex} total ({embedded_count} embedded in BSP)")
        print(f"  CT Spawns ({len(ct_spawns)}): first is {ct_spawns[0] if ct_spawns else 'None'}")
        print(f"  T Spawns ({len(t_spawns)}): first is {t_spawns[0] if t_spawns else 'None'}")

for name, path in MAPS:
    inspect_map(name, path)
