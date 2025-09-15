import fs from "fs";
import path from "path";
import clipboardy from "clipboardy";
import { fileURLToPath } from "url";

// Needed to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set your output directory and output filename
const outputDir = path.resolve("from_clipboard_output");
const outputFilename = "for_markmap_export.md";

function bulletsToPrefixedHeaders(text) {
    const lines = text.split(/\r?\n/);

    return lines.map(line => {
        const trimmed = line.trimStart();

        if (trimmed.startsWith("- ")) {
            // Count indentation, treating tabs as 4 spaces
            const expandedIndent = line.replace(/^\t+/, match => "    ".repeat(match.length));
            const indentSpaces = expandedIndent.length - trimmed.length;

            // Calculate header level
            const level = Math.floor(indentSpaces / 4) + 1;
            const headerPrefix = "#".repeat(level);

            // Preserve exact original indentation (tabs/spaces)
            const originalIndent = line.slice(0, line.indexOf(trimmed));
            return `${originalIndent}- ${headerPrefix} ${trimmed.slice(2).trim()}`;
        }

        return line;
    }).join("\n");
}

async function main() {
    const clipboardContent = await clipboardy.read();
    if (!clipboardContent.trim()) {
        console.error("❌ Clipboard is empty or does not contain text.");
        process.exit(1);
    }

    const processed = bulletsToPrefixedHeaders(clipboardContent);

    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, processed, "utf8");

    console.log(`✅ Processed clipboard content saved to: ${outputPath}`);
}

main();
