"""
Fetch CC0 PBR textures (Poly Haven) for Villa Auren.
All Poly Haven assets are CC0 1.0 — safe for public distribution.

Downloads 1k JPG maps per material:
  diff   -> base color (sRGB)
  nor_gl -> OpenGL normal map (glTF convention)
  arm    -> packed AO/Roughness/Metal (glTF metallicRoughness uses G=rough, B=metal)

Output: assets_source/textures/villa_auren/<asset>/ + manifest.json
Usage:  python scripts/fetch_villa_textures.py
"""
import json
import os
import urllib.request

UA = {"User-Agent": "JarBees-AurenWorldLab/1.0"}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets_source", "textures", "villa_auren")
RES = "1k"

# Generator material -> Poly Haven asset id
MATERIAL_TEXTURES = {
    "MAT_Stone_Chateau": "castle_wall_slates",
    "MAT_Stone_Floor": "large_square_pattern_01",
    "MAT_Stone_Pavers": "brick_pavement_02",
    "MAT_Wood_Timber": "dark_wooden_planks",
    "MAT_Steel_Dark": "metal_plate_02",
    "MAT_Wall_Plaster": "plaster_grey_04",
    "MAT_Roof_Slate": "patterned_slate_tiles",
    "MAT_Lab_Concrete": "concrete_floor_worn_001",
}
MAPS = {"diff": "Diffuse", "nor_gl": "nor_gl", "arm": "arm"}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = {"source": "https://polyhaven.com", "license": "CC0 1.0", "resolution": RES, "materials": {}}

    for mat, asset in MATERIAL_TEXTURES.items():
        info = json.loads(get(f"https://api.polyhaven.com/info/{asset}"))
        files = json.loads(get(f"https://api.polyhaven.com/files/{asset}"))
        # Poly Haven dimensions are in millimetres [width, height]
        size_m = round(float(info["dimensions"][0]) / 1000.0, 3)
        asset_dir = os.path.join(OUT_DIR, asset)
        os.makedirs(asset_dir, exist_ok=True)

        entry = {"asset": asset, "name": info.get("name", asset), "size_m": size_m, "maps": {}}
        for key, api_key in MAPS.items():
            url = files[api_key][RES]["jpg"]["url"]
            dest = os.path.join(asset_dir, os.path.basename(url))
            if not os.path.exists(dest):
                with open(dest, "wb") as f:
                    f.write(get(url))
            entry["maps"][key] = os.path.relpath(dest, OUT_DIR).replace("\\", "/")
        manifest["materials"][mat] = entry
        print(f"[OK] {mat:20s} <- {asset} ({size_m} m)")

    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Manifest: {os.path.join(OUT_DIR, 'manifest.json')}")


if __name__ == "__main__":
    main()
