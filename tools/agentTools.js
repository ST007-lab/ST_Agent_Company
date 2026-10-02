const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const WORKSPACE = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(WORKSPACE, "public", "outputs");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/* =========================================================
   PATH SECURITY
========================================================= */

function safeWorkspacePath(relativePath = ".") {
  const fullPath = path.resolve(WORKSPACE, relativePath);

  if (
    fullPath !== WORKSPACE &&
    !fullPath.startsWith(WORKSPACE + path.sep)
  ) {
    throw new Error(
      "ACCESS DENIED: Outside ST Agent Company workspace."
    );
  }

  return fullPath;
}

function cleanOutputName(filePath = "output.txt") {
  let clean = String(filePath)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^public\/outputs\//i, "")
    .replace(/^outputs\//i, "");

  clean = clean.replace(/\.\./g, "");

  if (!clean) {
    clean = "output.txt";
  }

  return clean;
}

function outputPath(relativePath = "output.txt") {
  const clean = cleanOutputName(relativePath);
  const full = path.resolve(OUTPUT_DIR, clean);

  if (
    full !== OUTPUT_DIR &&
    !full.startsWith(OUTPUT_DIR + path.sep)
  ) {
    throw new Error("ACCESS DENIED: Invalid output path.");
  }

  return {
    full,
    relative: `public/outputs/${clean}`,
    url: `/outputs/${clean}`
  };
}

/* =========================================================
   READ FILE
========================================================= */

function readFile(relativePath) {
  const filePath = safeWorkspacePath(relativePath);

  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      error: "File not found.",
      path: relativePath
    };
  }

  const stat = fs.statSync(filePath);

  if (stat.isDirectory()) {
    return {
      success: false,
      error: "Path is a directory, not a file.",
      path: relativePath
    };
  }

  return {
    success: true,
    path: relativePath,
    content: fs.readFileSync(filePath, "utf8")
  };
}

/* =========================================================
   WRITE OUTPUT
   ALL GENERATED FILES GO HERE
========================================================= */

function writeFile(relativePath, content) {
  const target = outputPath(relativePath);

  fs.mkdirSync(path.dirname(target.full), {
    recursive: true
  });

  fs.writeFileSync(
    target.full,
    String(content),
    "utf8"
  );

  return {
    success: true,
    type: "file",
    path: target.relative,
    url: target.url,
    preview:
      /\.(html?|xhtml)$/i.test(target.full)
        ? `/preview?file=${encodeURIComponent(
            target.relative
          )}`
        : null
  };
}

/* =========================================================
   LIST FILES
========================================================= */

function listFiles(relativePath = ".") {
  const filePath = safeWorkspacePath(relativePath);

  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      error: "Directory not found."
    };
  }

  function walk(dir, base = "") {
    const result = [];

    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const rel = path.join(base, item);

      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        result.push({
          type: "directory",
          path: rel.replace(/\\/g, "/")
        });

        result.push(
          ...walk(full, rel)
        );
      } else {
        result.push({
          type: "file",
          path: rel.replace(/\\/g, "/"),
          size: stat.size
        });
      }
    }

    return result;
  }

  return {
    success: true,
    path: relativePath,
    files: walk(filePath)
  };
}

/* =========================================================
   TERMINAL
   RESTRICTED COMMANDS
========================================================= */

const ALLOWED_COMMANDS = new Set([
  "node",
  "npm",
  "npx",
  "git"
]);

async function runTerminal(command, args = []) {
  const executable = String(command).trim();

  if (!ALLOWED_COMMANDS.has(executable)) {
    throw new Error(
      `Command "${executable}" is not allowed.`
    );
  }

  const safeArgs = Array.isArray(args)
    ? args.map(String)
    : [];

  const result = await execFileAsync(
    executable,
    safeArgs,
    {
      cwd: WORKSPACE,
      windowsHide: true,
      maxBuffer: 5 * 1024 * 1024
    }
  );

  return {
    success: true,
    command: executable,
    args: safeArgs,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

/* =========================================================
   BROWSER
========================================================= */

let browser = null;
let browserPage = null;

async function getBrowser() {
  if (!browser) {
    const { chromium } = require("playwright");

    browser = await chromium.launch({
      headless: true
    });

    browserPage = await browser.newPage({
      viewport: {
        width: 1440,
        height: 900
      }
    });
  }

  return browserPage;
}

async function openBrowser(url) {
  const page = await getBrowser();

  await page.goto(String(url), {
    waitUntil: "networkidle",
    timeout: 30000
  });

  return {
    success: true,
    url: page.url(),
    title: await page.title()
  };
}

/* =========================================================
   SCREENSHOT
========================================================= */

async function browserScreenshot(relativePath = "browser-screenshot.png") {
  const page = await getBrowser();

  const target = outputPath(relativePath);

  await page.screenshot({
    path: target.full,
    fullPage: true
  });

  return {
    success: true,
    type: "screenshot",
    path: target.relative,
    url: target.url,
    preview: target.url
  };
}

/* =========================================================
   DOWNLOAD ASSET
========================================================= */

function downloadAsset(url, relativePath) {
  return new Promise((resolve, reject) => {
    const target = outputPath(relativePath);

    fs.mkdirSync(path.dirname(target.full), {
      recursive: true
    });

    const protocol = String(url).startsWith("https")
      ? https
      : http;

    const request = protocol.get(
      String(url),
      response => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();

          downloadAsset(
            response.headers.location,
            relativePath
          )
            .then(resolve)
            .catch(reject);

          return;
        }

        if (response.statusCode !== 200) {
          response.resume();

          reject(
            new Error(
              `Download failed with HTTP ${response.statusCode}`
            )
          );

          return;
        }

        let size = 0;

        const stream = fs.createWriteStream(
          target.full
        );

        response.on("data", chunk => {
          size += chunk.length;

          if (size > 25 * 1024 * 1024) {
            request.destroy();

            try {
              stream.destroy();
              fs.unlinkSync(target.full);
            } catch (_) {}

            reject(
              new Error(
                "Download exceeds 25MB limit."
              )
            );
          }
        });

        response.pipe(stream);

        stream.on("finish", () => {
          stream.close();

          resolve({
            success: true,
            type: "download",
            path: target.relative,
            url: target.url,
            size
          });
        });

        stream.on("error", reject);
      }
    );

    request.on("error", reject);
  });
}

/* =========================================================
   IMAGE GENERATION
========================================================= */

async function generateImage(
  prompt,
  outputPathName = "agent-image.png"
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing from .env"
    );
  }

  const { GoogleGenAI } =
    await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const interaction =
    await ai.interactions.create({
      model: "gemini-3.1-flash-image",
      input: String(prompt)
    });

  const imageOutput =
    interaction.output?.find(
      item => item.type === "image"
    );

  if (
    !imageOutput ||
    !imageOutput.data
  ) {
    throw new Error(
      "Image model did not return an image."
    );
  }

  const target =
    outputPath(outputPathName);

  fs.mkdirSync(
    path.dirname(target.full),
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    target.full,
    Buffer.from(
      imageOutput.data,
      "base64"
    )
  );

  return {
    success: true,
    type: "image",
    path: target.relative,
    url: target.url,
    preview: target.url
  };
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  readFile,
  writeFile,
  listFiles,
  runTerminal,
  openBrowser,
  browserScreenshot,
  downloadAsset,
  generateImage
};