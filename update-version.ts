// update-version.ts
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// ESM 모드에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.resolve(__dirname, "package.json");
const envPath = path.resolve(__dirname, ".env");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

let env = "";
if (fs.existsSync(envPath)) {
    env = fs.readFileSync(envPath, "utf-8");
    env = env.replace(/VITE_APP_VERSION\s*=.*/g, "").trim();
}
env += `\nVITE_APP_VERSION="${pkg.version}"\n`;
fs.writeFileSync(envPath, env);

console.log(`✅ Updated VITE_APP_VERSION=${pkg.version}`);
