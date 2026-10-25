const fs = require('fs');

const bspPath = 'G:/cs 1.6 maps/surf_boreas/surf_boreas/maps/surf_boreas-compile.bsp';
const buf = fs.readFileSync(bspPath);

const entOff = buf.readInt32LE(4);
const entLen = buf.readInt32LE(8);
const entStr = buf.toString('latin1', entOff, entOff + entLen);

const blocks = entStr.split('{');
const spawns = [];
for (const b of blocks) {
  if (b.indexOf('info_player_start') !== -1 || b.indexOf('info_player_deathmatch') !== -1) {
    const lines = b.split('\n');
    for (const line of lines) {
      if (line.indexOf('"origin"') !== -1) {
        const parts = line.split('"');
        if (parts.length >= 4) {
          spawns.push(parts[3]);
        }
      }
    }
  }
}

console.log('Spawns found:', spawns.length);
console.log('Sample spawns (BSP coords):', spawns.slice(0, 5));

// Check center offset used in convert_custom_map.py:
// raw_verts
const lumps = [];
for (let i = 0; i < 15; i++) {
  lumps.push([buf.readInt32LE(4 + i * 8), buf.readInt32LE(8 + i * 8)]);
}
const vertOff = lumps[3][0];
const vertLen = lumps[3][1];
const numVerts = vertLen / 12;
let minX = 1e9, maxX = -1e9;
let minY = 1e9, maxY = -1e9;
let minZ = 1e9, maxZ = -1e9;

for (let i = 0; i < numVerts; i++) {
  const x = buf.readFloatLE(vertOff + i * 12);
  const y = buf.readFloatLE(vertOff + i * 12 + 4);
  const z = buf.readFloatLE(vertOff + i * 12 + 8);
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;
}

const cx = (minX + maxX) / 2.0;
const cy = (minY + maxY) / 2.0;
const cz = minZ;
const SCALE = 0.0254;

console.log('cx:', cx, 'cy:', cy, 'cz:', cz);

for (const s of spawns.slice(0, 3)) {
  const [bx, by, bz] = s.trim().split(/\s+/).map(Number);
  const gx = (bx - cx) * SCALE;
  const gy = (bz - cz) * SCALE;
  const gz = -(by - cy) * SCALE;
  console.log(`BSP: [${bx}, ${by}, ${bz}] -> Three.js: [${gx.toFixed(2)}, ${gy.toFixed(2)}, ${gz.toFixed(2)}]`);
}
