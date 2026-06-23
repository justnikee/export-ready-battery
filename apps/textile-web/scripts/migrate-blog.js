/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('Supabase Key:', supabaseKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTable() {
    console.log('🚀 Checking blog_posts table...\n');

    try {
        // Try to query the table
        const { data, error } = await supabase
            .from('blog_posts')
            .select('id')
            .limit(1);

        if (error) {
            if (error.code === '42P01') {
                // Table doesn't exist
                console.log('❌ Table blog_posts does not exist\n');
                console.log('📝 Please create it manually:');
                console.log('\n1. Go to Supabase Dashboard → SQL Editor');
                console.log('2. Copy and run the SQL from: sql/01_create_blog_posts.sql\n');

                // Read and display the SQL
                const sqlPath = path.join(__dirname, '..', 'sql', '01_create_blog_posts.sql');
                const sqlContent = fs.readFileSync(sqlPath, 'utf8');
                console.log('SQL to execute:');
                console.log('─'.repeat(80));
                console.log(sqlContent);
                console.log('─'.repeat(80));

            } else if (error.code === 'PGRST116') {
                // No rows but table exists
                console.log('✅ Table blog_posts exists! (Currently empty)');
                console.log('\n🎉 Database is ready!');
                console.log('\nNext steps:');
                console.log('1. Navigate to /admin/blog');
                console.log('2. Create your first blog post');
                console.log('3. View published posts at /blog\n');
            } else {
                console.error('⚠️  Unexpected error:', error.message);
            }
        } else {
            console.log('✅ Table blog_posts exists!');
            console.log(`📊 Found ${data ? data.length : 0} existing posts\n`);
            console.log('🎉 Database is ready!');
            console.log('\nNext steps:');
            console.log('1. Navigate to /admin/blog');
            console.log('2. Create or manage blog posts');
            console.log('3. View published posts at /blog\n');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAndCreateTable();
