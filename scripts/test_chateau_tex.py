import os
import struct
from PIL import Image

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"

def load_wad(wad_path):
    tex = {}
    if not os.path.exists(wad_path):
        return tex
    with open(wad_path, "rb") as f:
        magic, numlumps, info_ofs = struct.unpack("<4sII", f.read(12))
        f.seek(info_ofs)
        entries = []
        for _ in range(numlumps):
            filepos, disksize, size, ltype, comp, pad, name = struct.unpack("<IIIbbH16s", f.read(32))
            clean_name = name.split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
            entries.append((filepos, clean_name, ltype))
        for pos, name, ltype in entries:
            if ltype == 0x43:
                f.seek(pos)
                tex_name, w, h, off0, off1, off2, off3 = struct.unpack("<16sIIIIII", f.read(40))
                if off0 > 0:
                    f.seek(pos + off0)
                    pix_data = f.read(w * h)
                    f.seek(pos + off3 + (w//8)*(h//8))
                    pal_count = struct.unpack("<H", f.read(2))[0]
                    pal_raw = f.read(pal_count * 3)
                    img = Image.frombytes("P", (w, h), pix_data)
                    img.putpalette(pal_raw)
                    tex[name] = img.convert("RGB")
    return tex

wad_tex = {}
wad_tex.update(load_wad(os.path.join(CS_ROOT, r"valve\halflife.wad")))
wad_tex.update(load_wad(os.path.join(CS_ROOT, r"cstrike\chateau.wad")))

bsp_path = os.path.join(CS_ROOT, r"cstrike\maps\de_chateau.bsp")
missing = []
found = 0
with open(bsp_path, "rb") as f:
    f.seek(4)
    lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
    f.seek(lumps[2][0])
    numtex = struct.unpack("<I", f.read(4))[0]
    tex_offsets = [struct.unpack("<i", f.read(4))[0] for _ in range(numtex)]
    for off in tex_offsets:
        if off < 0:
            continue
        f.seek(lumps[2][0] + off)
        tname = f.read(16).split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
        if tname in wad_tex:
            found += 1
        else:
            missing.append(tname)

print(f"de_chateau: found {found} textures in WADs, missing {len(missing)}: {missing}")
