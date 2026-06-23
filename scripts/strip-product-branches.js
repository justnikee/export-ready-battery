const fs = require('fs');

function stripBattery(content) {
  // Replace isTextile declarations with false
  content = content.replace(/const\s+isTextile\s*=\s*[^;]+;/g, 'const isTextile = false;');
  content = content.replace(/const\s+isTextileBatch\s*=\s*[^;]+;/g, 'const isTextileBatch = false;');

  // Simple string ternaries
  content = content.replace(/isTextile\s+\?\s*"Lot"\s*:\s*"Batch"/g, '"Batch"');
  content = content.replace(/isTextile\s+\?\s*"Batch"\s*:\s*"Lot"/g, '"Lot"');
  content = content.replace(/isTextile\s+\?\s*"lot"\s*:\s*"batch"/g, '"batch"');
  content = content.replace(/isTextile\s+\?\s*"batch"\s*:\s*"lot"/g, '"lot"');
  content = content.replace(/isTextile\s+\?\s*"lots"\s*:\s*"batches"/g, '"batches"');
  content = content.replace(/isTextile\s+\?\s*"batches"\s*:\s*"lots"/g, '"lots"');
  content = content.replace(/isTextile\s+\?\s*"👕"\s*:\s*"🔋"/g, '"🔋"');
  content = content.replace(/isTextile\s+\?\s*"Textile"\s*:\s*"Battery"/g, '"Battery"');
  content = content.replace(/isTextile\s+\?\s*"Battery"\s*:\s*"Textile"/g, '"Textile"');
  content = content.replace(/isTextile\s+\?\s*"Create Lot"\s*:\s*"Create Batch"/g, '"Create Batch"');
  content = content.replace(/isTextile\s+\?\s*"Create Batch"\s*:\s*"Create Lot"/g, '"Create Lot"');
  content = content.replace(/isTextile\s+\?\s*"Textile Passport"\s*:\s*"Battery Passport"/g, '"Battery Passport"');
  content = content.replace(/isTextile\s+\?\s*"Battery Passport"\s*:\s*"Textile Passport"/g, '"Textile Passport"');
  content = content.replace(/isTextile\s+\?\s*"EU Textile Passport"\s*:\s*"EU Battery Passport"/g, '"EU Battery Passport"');
  content = content.replace(/isTextile\s+\?\s*"EU Battery Passport"\s*:\s*"EU Textile Passport"/g, '"EU Textile Passport"');
  content = content.replace(/isTextile\s+\?\s*"Textile Manufacturer"\s*:\s*"Battery Manufacturer"/g, '"Battery Manufacturer"');
  content = content.replace(/isTextile\s+\?\s*"Battery Manufacturer"\s*:\s*"Textile Manufacturer"/g, '"Textile Manufacturer"');
  content = content.replace(/isTextile\s+\?\s*"In Use"\s*:\s*"In Service"/g, '"In Service"');
  content = content.replace(/isTextile\s+\?\s*"Recycled"\s*:\s*"End of Life"/g, '"End of Life"');
  content = content.replace(/isTextile\s+\?\s*"India QCO"\s*:\s*"Battery Aadhaar"/g, '"Battery Aadhaar"');
  content = content.replace(/isTextile\s+\?\s*"Battery Aadhaar"\s*:\s*"India QCO"/g, '"India QCO"');
  content = content.replace(/isTextile\s+\?\s*"Digital Product Passport"\s*:\s*"Battery Passport"/g, '"Battery Passport"');
  content = content.replace(/isTextile\s+\?\s*"Battery Passport"\s*:\s*"Digital Product Passport"/g, '"Digital Product Passport"');
  content = content.replace(/isTextileBatch\s+\?\s*"Lot"\s*:\s*"Batch"/g, '"Batch"');
  content = content.replace(/isTextileBatch\s+\?\s*"lot"\s*:\s*"batch"/g, '"batch"');
  content = content.replace(/isTextileBatch\s+\?\s*"lots"\s*:\s*"batches"/g, '"batches"');

  // Logical NOT ternaries: {!isTextile ? (A) : (B)} → A
  content = content.replace(/\{!isTextile\s+\?\s*\(\s*([\s\S]*?)\)\s*:\s*\(\s*([\s\S]*?)\)\s*\}/g, '$1');

  // Simple !isTextile && blocks: {!isTextile && (X)} → {X}
  // This is risky with nested parens, so we only do simple inline ones
  content = content.replace(/\{!isTextile\s+&&\s*([^\n{}]+)\}/g, '{$1}');

  // isTextile && blocks: {isTextile && (X)} → remove (for simple inline)
  content = content.replace(/\{isTextile\s+&&\s*([^\n{}]+)\}/g, '');

  // isTextile && multiline blocks - very aggressive removal
  // We look for {isTextile && ( ... )} where ... doesn't contain unbalanced parens
  // This is hard with regex, so we'll use a loop with depth counting
  let prev;
  do {
    prev = content;
    content = content.replace(/\{isTextile\s+&&\s*\(\s*([\s\S]*?)\)\s*\}/g, (match, inner) => {
      const openParens = (inner.match(/\(/g) || []).length;
      const closeParens = (inner.match(/\)/g) || []).length;
      if (openParens === closeParens) {
        return '';
      }
      return match;
    });
  } while (prev !== content);

  return content;
}

function stripTextile(content) {
  // Replace isTextile declarations with true
  content = content.replace(/const\s+isTextile\s*=\s*[^;]+;/g, 'const isTextile = true;');
  content = content.replace(/const\s+isTextileBatch\s*=\s*[^;]+;/g, 'const isTextileBatch = true;');

  // Simple string ternaries (reverse of above)
  content = content.replace(/isTextile\s+\?\s*"Lot"\s*:\s*"Batch"/g, '"Lot"');
  content = content.replace(/isTextile\s+\?\s*"Batch"\s*:\s*"Lot"/g, '"Batch"');
  content = content.replace(/isTextile\s+\?\s*"lot"\s*:\s*"batch"/g, '"lot"');
  content = content.replace(/isTextile\s+\?\s*"batch"\s*:\s*"lot"/g, '"batch"');
  content = content.replace(/isTextile\s+\?\s*"lots"\s*:\s*"batches"/g, '"lots"');
  content = content.replace(/isTextile\s+\?\s*"batches"\s*:\s*"lots"/g, '"batches"');
  content = content.replace(/isTextile\s+\?\s*"👕"\s*:\s*"🔋"/g, '"👕"');
  content = content.replace(/isTextile\s+\?\s*"Textile"\s*:\s*"Battery"/g, '"Textile"');
  content = content.replace(/isTextile\s+\?\s*"Battery"\s*:\s*"Textile"/g, '"Battery"');
  content = content.replace(/isTextile\s+\?\s*"Create Lot"\s*:\s*"Create Batch"/g, '"Create Lot"');
  content = content.replace(/isTextile\s+\?\s*"Create Batch"\s*:\s*"Create Lot"/g, '"Create Batch"');
  content = content.replace(/isTextile\s+\?\s*"Textile Passport"\s*:\s*"Battery Passport"/g, '"Textile Passport"');
  content = content.replace(/isTextile\s+\?\s*"Battery Passport"\s*:\s*"Textile Passport"/g, '"Battery Passport"');
  content = content.replace(/isTextile\s+\?\s*"EU Textile Passport"\s*:\s*"EU Battery Passport"/g, '"EU Textile Passport"');
  content = content.replace(/isTextile\s+\?\s*"EU Battery Passport"\s*:\s*"EU Textile Passport"/g, '"EU Battery Passport"');
  content = content.replace(/isTextile\s+\?\s*"Textile Manufacturer"\s*:\s*"Battery Manufacturer"/g, '"Textile Manufacturer"');
  content = content.replace(/isTextile\s+\?\s*"Battery Manufacturer"\s*:\s*"Textile Manufacturer"/g, '"Battery Manufacturer"');
  content = content.replace(/isTextile\s+\?\s*"In Use"\s*:\s*"In Service"/g, '"In Use"');
  content = content.replace(/isTextile\s+\?\s*"Recycled"\s*:\s*"End of Life"/g, '"Recycled"');
  content = content.replace(/isTextile\s+\?\s*"India QCO"\s*:\s*"Battery Aadhaar"/g, '"India QCO"');
  content = content.replace(/isTextile\s+\?\s*"Battery Aadhaar"\s*:\s*"India QCO"/g, '"Battery Aadhaar"');
  content = content.replace(/isTextile\s+\?\s*"Digital Product Passport"\s*:\s*"Battery Passport"/g, '"Digital Product Passport"');
  content = content.replace(/isTextile\s+\?\s*"Battery Passport"\s*:\s*"Digital Product Passport"/g, '"Battery Passport"');
  content = content.replace(/isTextileBatch\s+\?\s*"Lot"\s*:\s*"Batch"/g, '"Lot"');
  content = content.replace(/isTextileBatch\s+\?\s*"lot"\s*:\s*"batch"/g, '"lot"');
  content = content.replace(/isTextileBatch\s+\?\s*"lots"\s*:\s*"batches"/g, '"lots"');

  // Ternaries: {isTextile ? (A) : (B)} → A
  content = content.replace(/\{isTextile\s+\?\s*\(\s*([\s\S]*?)\)\s*:\s*\(\s*([\s\S]*?)\)\s*\}/g, '$1');

  // Simple isTextile && blocks: {isTextile && (X)} → {X}
  content = content.replace(/\{isTextile\s+&&\s*([^\n{}]+)\}/g, '{$1}');

  // !isTextile && blocks: {!isTextile && (X)} → remove (for simple inline)
  content = content.replace(/\{!isTextile\s+&&\s*([^\n{}]+)\}/g, '');

  // !isTextile && multiline blocks - aggressive removal
  let prev;
  do {
    prev = content;
    content = content.replace(/\{!isTextile\s+&&\s*\(\s*([\s\S]*?)\)\s*\}/g, (match, inner) => {
      const openParens = (inner.match(/\(/g) || []).length;
      const closeParens = (inner.match(/\)/g) || []).length;
      if (openParens === closeParens) {
        return '';
      }
      return match;
    });
  } while (prev !== content);

  return content;
}

const app = process.argv[2];
const product = process.argv[3];
const files = process.argv.slice(4);

const fn = product === 'battery' ? stripBattery : stripTextile;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`Missing: ${file}`);
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  const result = fn(content);
  fs.writeFileSync(file, result, 'utf8');
  console.log(`Stripped ${product} branches from ${file}`);
}
