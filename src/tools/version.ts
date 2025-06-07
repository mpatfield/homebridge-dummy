import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadPackageJson(): any {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const packageJSONPath = path.join(__dirname, '../../package.json');
  return JSON.parse(fs.readFileSync(packageJSONPath, { encoding: 'utf8' }));
}

export default function getVersion(): string {
  try {
    return loadPackageJson().version;
  } catch (error) {
    return '0.0.0';
  }
}