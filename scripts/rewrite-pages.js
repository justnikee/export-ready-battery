const fs = require('fs');
const path = require('path');

function processFile(filePath, product) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Skip files that don't reference product
  if (!content.includes('product') && !content.includes('isProductSlug') && !content.includes('getProductConfig')) {
    return;
  }

  // Case 1: Simple re-export like `export { default } from "..."`
  if (/^export\s+\{\s*default\s*\}\s+from\s+/.test(content.trim())) {
    return; // keep as is
  }

  const isBattery = product === 'battery';

  // Extract imports
  const lines = content.split('\n');
  let newLines = [];
  let inRemovedImport = false;

  for (const line of lines) {
    // Remove imports of the opposite product's components
    if (isBattery && (
      line.includes('TextileDashboardPage') ||
      line.includes('TextileTeamPage') ||
      line.includes('TextileOnboardingPage') ||
      line.includes('TextileBatchesPage') ||
      line.includes('TextileLifecyclePage') ||
      line.includes('TextileTemplatesPage') ||
      line.includes('TextileCompliancePage') ||
      line.includes('TextileSettingsPage') ||
      line.includes('textile-batches-page') ||
      line.includes('textile-lifecycle-page') ||
      line.includes('textile-templates-page') ||
      line.includes('textile-compliance-page') ||
      line.includes('textile-settings-page') ||
      line.includes('textile-dashboard-page') ||
      line.includes('textile-team-page') ||
      line.includes('textile-onboarding-page') ||
      line.includes('textile-analytics-page')
    )) {
      continue;
    }
    if (!isBattery && (
      line.includes('BatteryDashboardPage') ||
      line.includes('BatteryTeamPage') ||
      line.includes('BatteryOnboardingPage') ||
      line.includes('BatteryBatchesPage') ||
      line.includes('BatteryLifecyclePage') ||
      line.includes('BatteryTemplatesPage') ||
      line.includes('BatteryCompliancePage') ||
      line.includes('BatterySettingsPage') ||
      line.includes('BatteryAnalyticsPage') ||
      line.includes('BatteryBillingPage') ||
      line.includes('BatteryDeveloperPage') ||
      line.includes('BatteryDispatchPage') ||
      line.includes('BatteryExportsPage') ||
      line.includes('BatteryPartnersPage') ||
      line.includes('BatteryRewardsPage') ||
      line.includes('battery-batches-page') ||
      line.includes('battery-lifecycle-page') ||
      line.includes('battery-templates-page') ||
      line.includes('battery-compliance-page') ||
      line.includes('battery-settings-page') ||
      line.includes('battery-dashboard-page') ||
      line.includes('battery-team-page') ||
      line.includes('battery-onboarding-page') ||
      line.includes('battery-analytics-page') ||
      line.includes('battery-billing-page') ||
      line.includes('battery-developer-page') ||
      line.includes('battery-dispatch-page') ||
      line.includes('battery-exports-page') ||
      line.includes('battery-partners-page') ||
      line.includes('battery-rewards-page')
    )) {
      continue;
    }

    // Remove UnderDevelopment imports only if they're the only thing left for that branch
    // Actually, keep UnderDevelopment for textile-web pages that didn't have a real component
    // For battery-web, remove UnderDevelopment if it was only for the textile branch
    // We'll handle this more intelligently below by just keeping the return statement

    newLines.push(line);
  }

  let newContent = newLines.join('\n');

  // Remove notFound import if no longer used
  if (!newContent.includes('notFound(')) {
    newContent = newContent.replace(/import\s+\{\s*notFound\s*\}\s+from\s+"next\/navigation";\n?/, '');
  }

  // Remove isProductSlug and getProductConfig imports if no longer used
  if (!newContent.includes('isProductSlug')) {
    newContent = newContent.replace(/import\s+\{\s*isProductSlug\s*\}\s+from\s+"@\/lib\/products";\n?/, '');
  }
  if (!newContent.includes('getProductConfig')) {
    newContent = newContent.replace(/import\s+\{\s*getProductConfig\s*\}\s+from\s+"@\/lib\/products";\n?/, '');
  }
  if (!newContent.includes('getProductConfig') && !newContent.includes('isProductSlug') && newContent.includes('@/lib/products')) {
    newContent = newContent.replace(/import\s+\{\s*[^}]*\}\s+from\s+"@\/lib\/products";\n?/, '');
  }

  // For battery-web: transform ternary to keep else branch
  // Pattern: return product === "textile" ? ( <X /> ) : ( <Y /> );
  if (isBattery) {
    newContent = newContent.replace(
      /return\s+product\s+===\s+"textile"\s+\?\s*\(\s*[\s\S]*?\)\s*:\s*\(\s*([\s\S]*?)\);/,
      'return ($1);'
    );
    // Also handle inline without parens: return product === "textile" ? <X /> : <Y />;
    newContent = newContent.replace(
      /return\s+product\s+===\s+"textile"\s+\?\s*<[\s\S]*?>\s*:\s*(<[\s\S]*?>);/,
      'return $1;'
    );
  } else {
    // For textile-web: keep then branch
    newContent = newContent.replace(
      /return\s+product\s+===\s+"textile"\s+\?\s*\(\s*([\s\S]*?)\)\s*:\s*\(\s*[\s\S]*?\);/,
      'return ($1);'
    );
    newContent = newContent.replace(
      /return\s+product\s+===\s+"textile"\s+\?\s*(<[\s\S]*?)>\s*:\s*<[\s\S]*?>;/,
      'return $1>;'
    );
  }

  // Remove the entire params destructuring and validation block
  // Pattern: type ProductXProps = { params: Promise<{ product: string }>; };
  newContent = newContent.replace(/type\s+\w+Props\s*=\s*\{\s*params:\s*Promise<\{\s*product:\s*string\s*\}>\s*\};\s*\n?/g, '');
  newContent = newContent.replace(/type\s+\w+Props\s*=\s*\{\s*params:\s*Promise<\{\s*product:\s*string\s*\}>;\s*searchParams:[\s\S]*?\};\s*\n?/g, '');

  // Remove searchParams type if present
  newContent = newContent.replace(/type\s+\w+Props\s*=\s*\{\s*searchParams:[\s\S]*?\};\s*\n?/g, '');

  // Remove the function params destructuring and product validation
  // Pattern: export default async function X({ params, }: XProps) {
  newContent = newContent.replace(
    /export\s+default\s+async\s+function\s+\w+\(\{\s*params,\s*\}:\s*\w+Props\)\s*\{/g,
    'export default async function Page() {'
  );
  // Pattern without Props type: export default async function X({ params }: XProps)
  newContent = newContent.replace(
    /export\s+default\s+async\s+function\s+\w+\(\{\s*params\s*\}:\s*\w+Props\)\s*\{/g,
    'export default async function Page() {'
  );
  // Pattern with params and searchParams
  newContent = newContent.replace(
    /export\s+default\s+async\s+function\s+\w+\(\{\s*params,\s*searchParams\s*\}:\s*\w+Props\)\s*\{/g,
    'export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {'
  );

  // Remove: const { product } = await params;
  newContent = newContent.replace(/const\s+\{\s*product\s*\}\s*=\s*await\s+params;\s*\n?/g, '');

  // Remove: if (!isProductSlug(product)) { notFound(); }
  newContent = newContent.replace(/if\s*\(\s*!isProductSlug\(product\)\s*\)\s*\{\s*notFound\(\);\s*\}\s*\n?/g, '');

  // Remove: const config = getProductConfig(product); if (!config) { notFound(); }
  newContent = newContent.replace(/const\s+config\s*=\s*getProductConfig\(product\);\s*\n?/g, '');
  newContent = newContent.replace(/if\s*\(\s*!config\s*\)\s*\{\s*notFound\(\);\s*\}\s*\n?/g, '');

  // Replace config.auth.loginTitle with hardcoded strings or getProductConfig("battery")
  // For auth pages, replace config references with getProductConfig("battery") or hardcode
  if (newContent.includes('config.')) {
    if (isBattery) {
      newContent = newContent.replace(/config\.slug/g, '"battery"');
      newContent = newContent.replace(/config\.auth\.loginTitle/g, '"Welcome back"');
      newContent = newContent.replace(/config\.auth\.loginSubtitle/g, '"Sign in to manage your battery passports and compliance"');
      newContent = newContent.replace(/config\.auth\.registerTitle/g, '"Get started with AnvayaLabs"');
      newContent = newContent.replace(/config\.auth\.registerSubtitle/g, '"Set up your battery passport workspace in under 2 minutes"');
      newContent = newContent.replace(/config\.auth\.inviteSubtitle/g, '"Create your password to join your battery passport workspace"');
    } else {
      newContent = newContent.replace(/config\.slug/g, '"textile"');
      newContent = newContent.replace(/config\.auth\.loginTitle/g, '"Welcome back"');
      newContent = newContent.replace(/config\.auth\.loginSubtitle/g, '"Sign in to manage your textile passports and supply chain compliance"');
      newContent = newContent.replace(/config\.auth\.registerTitle/g, '"Start your textile passport workspace"');
      newContent = newContent.replace(/config\.auth\.registerSubtitle/g, '"Set up your textile compliance workspace with product-specific onboarding"');
      newContent = newContent.replace(/config\.auth\.inviteSubtitle/g, '"Create your password to join your textile passport workspace"');
    }
  }

  // Replace product variable with hardcoded slug
  newContent = newContent.replace(/productSlug=\{product\}/g, `productSlug="${product}"`);
  newContent = newContent.replace(/product=\{product\}/g, `product="${product}"`);

  // Clean up multiple blank lines
  newContent = newContent.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Rewrote: ${filePath}`);
}

function walkDir(dir, product) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, product);
    } else if (entry.name === 'page.tsx') {
      processFile(fullPath, product);
    }
  }
}

const app = process.argv[2];
const product = process.argv[3];
if (!app || !product) {
  console.error('Usage: node rewrite-pages.js <app-dir> <product>');
  process.exit(1);
}

walkDir(path.join(app, 'app'), product);
