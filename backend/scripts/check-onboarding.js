// Script to check and fix onboarding_completed column
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2].trim();
        }
    });
}

async function checkOnboardingColumn() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment!');
        console.log('Looking for .env at:', path.join(__dirname, '../.env'));
        console.log('Please ensure backend/.env exists with DATABASE_URL set.');
        return;
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database');

        // Check if column exists
        const checkColumn = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'tenants' AND column_name = 'onboarding_completed';
        `);

        if (checkColumn.rows.length === 0) {
            console.log('\n❌ Column onboarding_completed does NOT exist!');
            console.log('\n📝 Running migration...');

            // Add the column
            await client.query(`
                ALTER TABLE tenants 
                ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
            `);

            // Set existing users as onboarded if they have address and support_email
            await client.query(`
                UPDATE tenants 
                SET onboarding_completed = TRUE 
                WHERE address IS NOT NULL AND support_email IS NOT NULL;
            `);

            console.log('✅ Migration complete!');
        } else {
            console.log('\n✅ Column onboarding_completed EXISTS');
            console.log('   Type:', checkColumn.rows[0].data_type);
            console.log('   Default:', checkColumn.rows[0].column_default);
        }

        // Show current tenants status
        const tenants = await client.query(`
            SELECT email, company_name, 
                   address IS NOT NULL as has_address,
                   support_email IS NOT NULL as has_support_email,
                   COALESCE(onboarding_completed, FALSE) as onboarding_completed
            FROM tenants
            JOIN users ON users.tenant_id = tenants.id
            ORDER BY tenants.created_at DESC
            LIMIT 5;
        `);

        console.log('\n📊 Current Tenants Status (last 5):');
        console.table(tenants.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkOnboardingColumn();
