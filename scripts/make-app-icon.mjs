import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public/uploads/colorbear-art/hero-offer-kit.png");
const output = path.join(root, "Beart Art Shop.app/Contents/Resources/BeartArtShop.icns");

const entries = [
  ["icp4", 16],
  ["icp5", 32],
  ["icp6", 64],
  ["ic07", 128],
  ["ic08", 256],
  ["ic09", 512],
  ["ic10", 1024],
];

function makeChunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, "ascii");
  header.writeUInt32BE(data.length + 8, 4);
  return Buffer.concat([header, data]);
}

const chunks = [];
for (const [type, size] of entries) {
  const data = await sharp(source)
    .resize(size, size, { fit: "cover", position: "center" })
    .ensureAlpha()
    .png()
    .toBuffer();
  chunks.push(makeChunk(type, data));
}

const body = Buffer.concat(chunks);
const header = Buffer.alloc(8);
header.write("icns", 0, 4, "ascii");
header.writeUInt32BE(body.length + 8, 4);

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, Buffer.concat([header, body]));
console.log(output);
