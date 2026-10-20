import json
import struct

with open(r'G:\new models\armor.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_bytes = f.read(chunk_len)
    gltf = json.loads(json_bytes.decode('utf-8'))
    print('GLTF Generator/Asset:', gltf.get('asset'))
    if 'meshes' in gltf:
        print('Meshes:', len(gltf['meshes']))
        for i, m in enumerate(gltf['meshes']):
            print(f"  Mesh {i}: {m.get('name', 'unnamed')} - {len(m.get('primitives', []))} prims")
            for p in m.get('primitives', []):
                print(f"    attributes: {list(p.get('attributes', {}).keys())}, material: {p.get('material')}")
    if 'nodes' in gltf:
        print('Nodes:', len(gltf['nodes']))
        for i, n in enumerate(gltf['nodes']):
            print(f"  Node {i}: {n.get('name', 'unnamed')} (mesh={n.get('mesh')}, skin={n.get('skin')}, children={n.get('children')})")
    if 'materials' in gltf:
        print('Materials:', len(gltf['materials']))
        for i, mat in enumerate(gltf['materials']):
            print(f"  Material {i}: {mat.get('name', 'unnamed')}")
            pbr = mat.get('pbrMetallicRoughness', {})
            print(f"    baseColorFactor: {pbr.get('baseColorFactor')}")
            print(f"    baseColorTexture: {pbr.get('baseColorTexture')}")
            print(f"    metallicRoughnessTexture: {pbr.get('metallicRoughnessTexture')}")
            print(f"    normalTexture: {mat.get('normalTexture')}")
    if 'images' in gltf:
        print('Images:', len(gltf['images']))
        for i, img in enumerate(gltf['images']):
            print(f"  Image {i}: {img.get('name', 'unnamed')}, mimeType={img.get('mimeType')}")
    if 'skins' in gltf:
        print('Skins:', len(gltf['skins']))
    if 'animations' in gltf:
        print('Animations:', len(gltf['animations']))
