const sharp = require("sharp");
const path = require("node:path");

const src = path.join(__dirname, "../public/logo-sijil.svg");
const out = path.join(__dirname, "../public");

async function generate() {
	await sharp(src).resize(192, 192).png().toFile(path.join(out, "icon-192.png"));
	await sharp(src).resize(512, 512).png().toFile(path.join(out, "icon-512.png"));
	console.log("Generated icon-192.png and icon-512.png");
}

generate().catch(console.error);
