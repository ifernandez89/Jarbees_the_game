import os
import struct
from PIL import Image

CS_ROOT = r"C:\Program Files (x86)\Counter-Strike 1.6"

def test_extract_embedded(bsp_rel):
    bsp_path = os.path.join(CS_ROOT, bsp_rel)
    extracted = 0
    with open(bsp_path, "rb") as f:
        f.seek(4)
        lumps = [struct.unpack("<II", f.read(8)) for _ in range(15)]
        f.seek(lumps[2][0])
        numtex = struct.unpack("<I", f.read(4))[0]
        tex_offsets = [struct.unpack("<i", f.read(4))[0] for _ in range(numtex)]
        for off in tex_offsets:
            if off < 0:
                continue
            base_pos = lumps[2][0] + off
            f.seek(base_pos)
            name, w, h, off0, off1, off2, off3 = struct.unpack("<16sIIIIII", f.read(40))
            clean_name = name.split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
            if off0 > 0:
                f.seek(base_pos + off0)
                pix = f.read(w * h)
                f.seek(base_pos + off3 + (w // 8) * (h // 8))
                pal_count = struct.unpack("<H", f.read(2))[0]
                pal_raw = f.read(pal_count * 3)
                img = Image.frombytes("P", (w, h), pix)
                img.putpalette(pal_raw)
                extracted += 1
    print(f"{bsp_rel}: successfully extracted {extracted} embedded textures!")

test_extract_embedded(r"cstrike\maps\cs_siege.bsp")
test_extract_embedded(r"cstrike\maps\de_aztec.bsp")
