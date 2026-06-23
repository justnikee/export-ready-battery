const fs = require('fs');
const path = require('path');

function cleanupFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remove unused notFound import
  if (!content.includes('notFound(')) {
    content = content.replace(/import\s+\{\s*notFound\s*\}\s+from\s+"next\/navigation";\s*\n?/g, '');
  }

  // Remove unused isProductSlug import
  if (!content.includes('isProductSlug')) {
    content = content.replace(/import\s+\{\s*isProductSlug\s*\}\s+from\s+"@\/lib\/products";\s*\n?/g, '');
  }

  // Remove unused getProductConfig import
  if (!content.includes('getProductConfig')) {
    content = content.replace(/import\s+\{\s*getProductConfig\s*\}\s+from\s+"@\/lib\/products";\s*\n?/g, '');
  }

  // Remove combined import from @/lib/products if neither is used
  if (!content.includes('getProductConfig') && !content.includes('isProductSlug')) {
    content = content.replace(/import\s+\{\s*[^}]*\}\s+from\s+"@\/lib\/products";\s*\n?/g, (match) => {
      if (match.includes('getProductConfig') || match.includes('isProductSlug')) {
        return '';
      }
      return match;
    });
  }

  // Remove multiline type props definitions
  content = content.replace(/type\s+\w+Props\s*=\s*\{\s*params:\s*Promise<\{\s*product:\s*string\s*\}>\s*\};\s*\n?/g, '');
  content = content.replace(/type\s+\w+Props\s*=\s*\{\s*params:\s*Promise<\{\s*product:\s*string\s*\}>;\s*searchParams:[\s\S]*?\};\s*\n?/g, '');
  content = content.replace(/type\s+\w+Props\s*=\s*\{\s*searchParams:[\s\S]*?\};\s*\n?/g, '');

  // Clean up multiple blank lines
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.replace(/^\n+/, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${filePath}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name === 'page.tsx') {
      cleanupFile(fullPath);
    }
  }
}

walkDir(path.join(process.argv[2], 'app'));
