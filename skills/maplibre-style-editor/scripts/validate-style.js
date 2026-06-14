// scripts/validate-style.js
import fs from "fs";
import { validateStyle } from "@maplibre/maplibre-gl-style-spec";

const stylePath = process.argv[2] ?? "style.json";
const style = JSON.parse(fs.readFileSync(stylePath, "utf8"));

const errors = validateStyle(style);

if (errors.length > 0) {
  console.error(errors);
  process.exit(1);
}

console.log("style.json is valid.");