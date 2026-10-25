import os
import struct

ROOT_CS = r"C:\Program Files (x86)\Counter-Strike 1.6"

for map_name in ['fy_pool_day.bsp', 'de_rats3.bsp', 'fy_iceworld.bsp', 'de_westwood.bsp']:
    p = os.path.join(ROOT_CS, 'cstrike', 'maps', map_name)
    if not os.path.exists(p):
        continue
    with open(p, 'rb') as f:
        f.seek(4)
        lumps = [struct.unpack('<II', f.read(8)) for _ in range(15)]
        f.seek(lumps[2][0])
        numtex = struct.unpack('<I', f.read(4))[0]
        tex_offsets = [struct.unpack('<i', f.read(4))[0] for _ in range(numtex)]
        embedded = 0
        names = []
        for off in tex_offsets:
            if off >= 0:
                f.seek(lumps[2][0] + off)
                name, w, h, off0, off1, off2, off3 = struct.unpack("<16sIIIIII", f.read(40))
                clean_name = name.split(b"\x00")[0].decode("latin-1", errors="ignore").lower()
                names.append(clean_name)
                if off0 > 0:
                    embedded += 1
        print(f"{map_name}: {numtex} textures, {embedded} embedded in BSP. Sample: {names[:4]}")
