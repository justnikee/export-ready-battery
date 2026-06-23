const fs = require('fs');

function safeStripBattery(content) {
  // Replace isTextile declarations with false
  content = content.replace(/const\s+isTextile\s*=\s*[^;]+;/g, 'const isTextile = false;');
  content = content.replace(/const\s+isTextileBatch\s*=\s*[^;]+;/g, 'const isTextileBatch = false;');

  // Simple inline string ternaries that don't span JSX
  content = content.replace(/isTextile\s+\?\s*"Lot"\s*:\s*"Batch"/g, '"Batch"');
  content = content.replace(/isTextile\s+\?\s*"lot"\s*:\s*"batch"/g, '"batch"');
  content = content.replace(/isTextile\s+\?\s*"lots"\s*:\s*"batches"/g, '"batches"');
  content = content.replace(/isTextile\s+\?\s*"👕"\s*:\s*"🔋"/g, '"🔋"');
  content = content.replace(/isTextile\s+\?\s*"Textile"\s*:\s*"Battery"/g, '"Battery"');
  content = content.replace(/isTextile\s+\?\s*"Create Lot"\s*:\s*"Create Batch"/g, '"Create Batch"');
  content = content.replace(/isTextile\s+\?\s*"Textile Passport"\s*:\s*"Battery Passport"/g, '"Battery Passport"');
  content = content.replace(/isTextile\s+\?\s*"EU Textile Passport"\s*:\s*"EU Battery Passport"/g, '"EU Battery Passport"');
  content = content.replace(/isTextile\s+\?\s*"Textile Manufacturer"\s*:\s*"Battery Manufacturer"/g, '"Battery Manufacturer"');
  content = content.replace(/isTextile\s+\?\s*"In Use"\s*:\s*"In Service"/g, '"In Service"');
  content = content.replace(/isTextile\s+\?\s*"Recycled"\s*:\s*"End of Life"/g, '"End of Life"');
  content = content.replace(/isTextile\s+\?\s*"India QCO"\s*:\s*"Battery Aadhaar"/g, '"Battery Aadhaar"');
  content = content.replace(/isTextile\s+\?\s*"Digital Product Passport"\s*:\s*"Battery Passport"/g, '"Battery Passport"');
  content = content.replace(/isTextileBatch\s+\?\s*"Lot"\s*:\s*"Batch"/g, '"Batch"');
  content = content.replace(/isTextileBatch\s+\?\s*"lot"\s*:\s*"batch"/g, '"batch"');
  content = content.replace(/isTextileBatch\s+\?\s*"lots"\s*:\s*"batches"/g, '"batches"');

  // Replace product_type checks in conditions
  content = content.replace(/batch\?\.product_type\s+===\s+"TEXTILE"/g, 'false');
  content = content.replace(/batchRecord\.product_type\s+===\s+"TEXTILE"/g, 'false');
  content = content.replace(/passport\.product_type\s+===\s+"TEXTILE"/g, 'false');
  content = content.replace(/user\?\.product_type\s+===\s+"TEXTILE"/g, 'false');

  // Remove textile-specific state declarations if they're simple
  content = content.replace(/const\s+\[textileCertifications,\s*setTextileCertifications\]\s*=\s*useState<string\[\]>\(\[\]\);\n?/g, '');

  // TODO comment at top
  if (!content.includes('TODO: big-bang split')) {
    content = '// TODO: big-bang split - textile branches were hardcoded to false; dead code should be removed in follow-up\n' + content;
  }

  return content;
}

function safeStripTextile(content) {
  content = content.replace(/const\s+isTextile\s*=\s*[^;]+;/g, 'const isTextile = true;');
  content = content.replace(/const\s+isTextileBatch\s*=\s*[^;]+;/g, 'const isTextileBatch = true;');

  content = content.replace(/isTextile\s+\?\s*"Lot"\s*:\s*"Batch"/g, '"Lot"');
  content = content.replace(/isTextile\s+\?\s*"lot"\s*:\s*"batch"/g, '"lot"');
  content = content.replace(/isTextile\s+\?\s*"lots"\s*:\s*"batches"/g, '"lots"');
  content = content.replace(/isTextile\s+\?\s*"👕"\s*:\s*"🔋"/g, '"👕"');
  content = content.replace(/isTextile\s+\?\s*"Textile"\s*:\s*"Battery"/g, '"Textile"');
  content = content.replace(/isTextile\s+\?\s*"Create Lot"\s*:\s*"Create Batch"/g, '"Create Lot"');
  content = content.replace(/isTextile\s+\?\s*"Textile Passport"\s*:\s*"Battery Passport"/g, '"Textile Passport"');
  content = content.replace(/isTextile\s+\?\s*"EU Textile Passport"\s*:\s*"EU Battery Passport"/g, '"EU Textile Passport"');
  content = content.replace(/isTextile\s+\?\s*"Textile Manufacturer"\s*:\s*"Battery Manufacturer"/g, '"Textile Manufacturer"');
  content = content.replace(/isTextile\s+\?\s*"In Use"\s*:\s*"In Service"/g, '"In Use"');
  content = content.replace(/isTextile\s+\?\s*"Recycled"\s*:\s*"End of Life"/g, '"Recycled"');
  content = content.replace(/isTextile\s+\?\s*"India QCO"\s*:\s*"Battery Aadhaar"/g, '"India QCO"');
  content = content.replace(/isTextile\s+\?\s*"Digital Product Passport"\s*:\s*"Battery Passport"/g, '"Digital Product Passport"');
  content = content.replace(/isTextileBatch\s+\?\s*"Lot"\s*:\s*"Batch"/g, '"Lot"');
  content = content.replace(/isTextileBatch\s+\?\s*"lot"\s*:\s*"batch"/g, '"lot"');
  content = content.replace(/isTextileBatch\s+\?\s*"lots"\s*:\s*"batches"/g, '"lots"');

  content = content.replace(/batch\?\.product_type\s+===\s+"TEXTILE"/g, 'true');
  content = content.replace(/batchRecord\.product_type\s+===\s+"TEXTILE"/g, 'true');
  content = content.replace(/passport\.product_type\s+===\s+"TEXTILE"/g, 'true');
  content = content.replace(/user\?\.product_type\s+===\s+"TEXTILE"/g, 'true');

  // Remove battery-specific state declarations
  content = content.replace(/const\s+\[batteryCategory,\s*setBatteryCategory\]\s*=\s*useState\(""\);\n?/g, '');

  if (!content.includes('TODO: big-bang split')) {
    content = '// TODO: big-bang split - battery branches were hardcoded to true; dead code should be removed in follow-up\n' + content;
  }

  return content;
}

const product = process.argv[2];
const files = process.argv.slice(3);
const fn = product === 'battery' ? safeStripBattery : safeStripTextile;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const result = fn(content);
  fs.writeFileSync(file, result, 'utf8');
  console.log(`Safe-stripped ${product} branches from ${file}`);
}
