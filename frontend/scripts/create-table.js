const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
        }
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local!');
    process.exit(1);
}

// Read SQL file
const sqlPath = path.join(__dirname, '..', 'sql', '01_create_blog_posts.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('🚀 Creating blog_posts table via Supabase REST API...\n');

// Extract host from URL
const url = new URL(supabaseUrl);
const apiUrl = `${supabaseUrl}/rest/v1/rpc`;

// Create the HTTP request
const postData = JSON.stringify({
    query: sqlContent
});

const options = {
    hostname: url.hostname,
    port: 443,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Migration successful!');
            console.log('\n🎉 Database is ready!');
            console.log('\nNext steps:');
            console.log('1. Navigate to /admin/blog');
            console.log('2. Create your first blog post');
            console.log('3. View published posts at /blog\n');
        } else {
            console.log('Response:', data);
            console.log('\n⚠️  The REST API approach may not support raw DDL.');
            console.log('\n📝 Please create the table manually:');
            console.log('\n1. Go to: https://supabase.com/dashboard/project/ysbtlokyakbvivqlnyyz/sql');
            console.log('2. Click "New Query"');
            console.log('3. Copy and paste the SQL below:\n');
            console.log('─'.repeat(80));
            console.log(sqlContent);
            console.log('─'.repeat(80));
            console.log('\n4. Click "Run" to execute');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please create the table manually via Supabase Dashboard');
});

req.write(postData);
req.end();
