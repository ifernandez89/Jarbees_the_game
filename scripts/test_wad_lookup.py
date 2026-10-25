import os
import struct
from PIL import Image

ROOT_CS = r"C:\Program Files (x86)\Counter-Strike 1.6"

def get_wad_textures(wad_path):
    tex_names = set()
    if not os.path.exists(wad_path):
        return tex_names
    with open(wad_path, "rb") as f:
        magic, numlumps, info_ofs = struct.unpack("<4sII", f.read(12))
        f.seek(info_ofs)
        for _ in range(numlumps):
            filepos, disksize, size, ltype, comp, pad, name = struct.unpack("<IIIbbH16s", f.read(32))
            clean_name = name.split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
            tex_names.add(clean_name)
    return tex_names

all_wads = {}
for root, dirs, files in os.walk(ROOT_CS):
    for f in files:
        if f.lower().endswith(".wad"):
            p = os.path.join(root, f)
            all_wads[f.lower()] = get_wad_textures(p)

print(f"Loaded {len(all_wads)} WADs.")

def check_map_textures(map_name, bsp_rel):
    bsp_path = os.path.join(ROOT_CS, bsp_rel)
    with open(bsp_path, "rb") as f:
        f.seek(4)
        lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
        f.seek(lumps[2][0])
        numtex = struct.unpack("<I", f.read(4))[0]
        tex_offsets = [struct.unpack("<i", f.read(4))[0] for _ in range(numtex)]
        embedded = 0
        missing = []
        found_in_wad = []
        for off in tex_offsets:
            if off < 0:
                continue
            f.seek(lumps[2][0] + off)
            tname = f.read(16).split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
            w, h, off0, off1, off2, off3 = struct.unpack("<IIIIII", f.read(24))
            if off0 > 0:
                embedded += 1
            else:
                found = False
                for wname, names in all_wads.items():
                    if tname in names:
                        found_in_wad.append((tname, wname))
                        found = True
                        break
                if not found:
                    missing.append(tname)
        print(f"\n{map_name}: {numtex} total")
        print(f"  Embedded in BSP: {embedded}")
        print(f"  Found in WADs: {len(found_in_wad)}")
        print(f"  Missing: {len(missing)} {missing[:5] if missing else ''}")

check_map_textures("cs_assault", r"cstrike\maps\cs_assault.bsp")
check_map_textures("cs_siege", r"cstrike\maps\cs_siege.bsp")
check_map_textures("de_aztec", r"cstrike\maps\de_aztec.bsp")
check_map_textures("de_aztec_cz", r"cstrike\maps\de_aztec_cz.bsp")
check_map_textures("de_chateau", r"cstrike\maps\de_chateau.bsp")
