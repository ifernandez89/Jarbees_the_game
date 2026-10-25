import os
import struct

ROOT_DIR = r"c:\Projects\Jarbees_the_game"
GLB_PATH = os.path.join(ROOT_DIR, "public", "models", "de_rats3.glb")

# Inspect GLB using python
import json

with open(GLB_PATH, "rb") as f:
    magic, ver, length = struct.unpack("<4sII", f.read(12))
    chunk0_len, chunk0_type = struct.unpack("<II", f.read(8))
    json_bytes = f.read(chunk0_len)
    gltf_json = json.loads(json_bytes.decode())
    chunk1_len, chunk1_type = struct.unpack("<II", f.read(8))
    bin_data = f.read(chunk1_len)

# Access position accessor
pos_accessor = None
for acc in gltf_json.get("accessors", []):
    if acc.get("type") == "VEC3":
        # check min and max
        min_v = acc.get("min", [])
        max_v = acc.get("max", [])
        print(f"Accessor min: {min_v}, max: {max_v}")
