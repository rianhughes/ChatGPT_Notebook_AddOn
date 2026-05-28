import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const repoRoot = resolve(projectRoot, "..");
const distDir = resolve(projectRoot, "dist");
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
const version = packageJson.version;
const targets = ["chrome", "firefox"];
const shouldPackageSource = process.env.PACKAGE_SOURCE !== "0";
const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});

mkdirSync(distDir, { recursive: true });

for (const target of targets) {
  run("npm", ["run", `build:${target}`], projectRoot);
  const archivePath = resolve(distDir, `chatgpt-notebook-${target}-${version}.zip`);
  rmSync(archivePath, { force: true });
  createZipArchive(resolve(distDir, target), archivePath);
}

const sourceArchivePath = resolve(distDir, `chatgpt-notebook-source-${version}.zip`);

if (shouldPackageSource) {
  rmSync(sourceArchivePath, { force: true });
  createZipArchive(repoRoot, sourceArchivePath, {
    exclude(relativePath) {
      const fileName = relativePath.split("/").pop() ?? relativePath;

      return (
        relativePath === ".git" ||
        relativePath.startsWith(".git/") ||
        fileName === ".env" ||
        (fileName.startsWith(".env.") && fileName !== ".env.example") ||
        relativePath === "node_modules" ||
        relativePath.startsWith("node_modules/") ||
        relativePath === "extension/dist" ||
        relativePath.startsWith("extension/dist/") ||
        relativePath === "extension/node_modules" ||
        relativePath.startsWith("extension/node_modules/")
      );
    },
  });
}

console.log("Created store packages:");
for (const target of targets) {
  console.log(`- ${resolve(distDir, `chatgpt-notebook-${target}-${version}.zip`)}`);
}
if (shouldPackageSource) {
  console.log(`- ${sourceArchivePath}`);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function createZipArchive(inputDir, archivePath, options = {}) {
  const files = listFiles(inputDir, options.exclude);
  const chunks = [];
  const centralDirectoryChunks = [];
  let offset = 0;

  for (const file of files) {
    const data = readFileSync(file.absolutePath);
    const name = Buffer.from(file.archivePath, "utf8");
    const crc = crc32(data);
    const { dosTime, dosDate } = toDosDateTime(statSync(file.absolutePath).mtime);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    chunks.push(localHeader, name, data);

    const centralDirectoryHeader = Buffer.alloc(46);
    centralDirectoryHeader.writeUInt32LE(0x02014b50, 0);
    centralDirectoryHeader.writeUInt16LE(20, 4);
    centralDirectoryHeader.writeUInt16LE(20, 6);
    centralDirectoryHeader.writeUInt16LE(0, 8);
    centralDirectoryHeader.writeUInt16LE(0, 10);
    centralDirectoryHeader.writeUInt16LE(dosTime, 12);
    centralDirectoryHeader.writeUInt16LE(dosDate, 14);
    centralDirectoryHeader.writeUInt32LE(crc, 16);
    centralDirectoryHeader.writeUInt32LE(data.length, 20);
    centralDirectoryHeader.writeUInt32LE(data.length, 24);
    centralDirectoryHeader.writeUInt16LE(name.length, 28);
    centralDirectoryHeader.writeUInt16LE(0, 30);
    centralDirectoryHeader.writeUInt16LE(0, 32);
    centralDirectoryHeader.writeUInt16LE(0, 34);
    centralDirectoryHeader.writeUInt16LE(0, 36);
    centralDirectoryHeader.writeUInt32LE(0, 38);
    centralDirectoryHeader.writeUInt32LE(offset, 42);
    centralDirectoryChunks.push(centralDirectoryHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectory = Buffer.concat(centralDirectoryChunks);
  const endOfCentralDirectory = Buffer.alloc(22);

  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(files.length, 8);
  endOfCentralDirectory.writeUInt16LE(files.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(centralDirectoryOffset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  writeFileSync(archivePath, Buffer.concat([...chunks, centralDirectory, endOfCentralDirectory]));
}

function listFiles(inputDir, exclude = () => false) {
  const files = [];

  visit(inputDir);
  return files.sort((left, right) => left.archivePath.localeCompare(right.archivePath));

  function visit(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = resolve(currentDir, entry.name);
      const archivePath = relative(inputDir, absolutePath).split(sep).join("/");

      if (exclude(archivePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile()) {
        files.push({ absolutePath, archivePath });
      }
    }
  }
}

function toDosDateTime(date) {
  const year = Math.max(date.getFullYear(), 1980);

  return {
    dosTime: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    dosDate: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function crc32(data) {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}
