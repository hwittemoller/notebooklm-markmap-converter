import fs from "fs";
import path from "path";
import clipboardy from "clipboardy";
import { fileURLToPath } from "url";
import { Transformer } from "markmap-lib";

// Needed for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set your output directory
const outputDir = path.resolve("from_clipboard_output");
const outputMarkdown = "for_markmap_export.md";
const outputHTML = "Mind Map.html";

function bulletsToPrefixedHeaders(text) {
    const lines = text.split(/\r?\n/);

    return lines.map(line => {
        const trimmed = line.trimStart();

        if (trimmed.startsWith("- ")) {
            // Expand tabs for calculation
            const expandedIndent = line.replace(/^\t+/, match => "    ".repeat(match.length));
            const indentSpaces = expandedIndent.length - trimmed.length;

            // Determine heading level
            const level = Math.floor(indentSpaces / 4) + 1;
            const headerPrefix = "#".repeat(level);

            // Preserve original indentation
            const originalIndent = line.slice(0, line.indexOf(trimmed));
            return `${originalIndent}- ${headerPrefix} ${trimmed.slice(2).trim()}`;
        }

        return line;
    }).join("\n");
}

function markdownToMarkmapHTML(markdown) {
    const transformer = new Transformer();
    const { root, features } = transformer.transform(markdown);
    const assets = transformer.getAssets(Array.from(features));

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Markmap</title>
${assets.styles.map(style => `<link rel="stylesheet" href="${style}">`).join("\n")}
</head>
<body>
<svg id="mindmap"></svg>
${assets.scripts.map(script => `<script src="${script}"></script>`).join("\n")}
<script>
const { Markmap } = window.markmap;
const data = ${JSON.stringify(root)};
Markmap.create("#mindmap", null, data);
</script>
</body>
</html>
`;
}

async function main() {
    const clipboardContent = await clipboardy.read();
    if (!clipboardContent.trim()) {
        console.error("❌ Clipboard is empty or does not contain text.");
        process.exit(1);
    }

    // Step 1: Convert bullets
    const processedMarkdown = bulletsToPrefixedHeaders(clipboardContent);

    // Step 2: Save processed Markdown
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
    const mdPath = path.join(outputDir, outputMarkdown);
    fs.writeFileSync(mdPath, processedMarkdown, "utf8");

    // Step 3: Generate Markmap HTML
    const htmlContent = markdownToMarkmapHTML(processedMarkdown);
    const htmlPath = path.join(outputDir, outputHTML);
    fs.writeFileSync(htmlPath, htmlContent, "utf8");

    console.log(`✅ Processed Markdown saved to: ${mdPath}`);
    console.log(`✅ Markmap HTML saved to: ${htmlPath}`);
}

main();
