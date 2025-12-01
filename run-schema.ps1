# Set database URL
$env:DATABASE_URL = "postgresql://postgres:PShFSqkTKxsLpoSQEuZXmZDYHQaRzyVL@mainline.proxy.rlwy.net:26058/railway"
$psqlPath = "C:\Program Files\PostgreSQL\14\bin\psql.exe"

Write-Host "Creating pgcrypto extension..." -ForegroundColor Cyan
& $psqlPath "$env:DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

Write-Host "Creating licenses table..." -ForegroundColor Cyan
& $psqlPath "$env:DATABASE_URL" -c @"
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL UNIQUE,
    checksum TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    max_devices INTEGER NOT NULL DEFAULT 1,
    used_devices INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    type TEXT NOT NULL DEFAULT 'full',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"@

Write-Host "Creating license_devices table..." -ForegroundColor Cyan
& $psqlPath "$env:DATABASE_URL" -c @"
CREATE TABLE IF NOT EXISTS license_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    hwid TEXT NOT NULL,
    installer_version TEXT,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE (license_id, hwid)
);
"@

Write-Host "Creating trigger function..." -ForegroundColor Cyan
& $psqlPath "$env:DATABASE_URL" -c @"
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;
"@

Write-Host "Creating trigger..." -ForegroundColor Cyan
& $psqlPath "$env:DATABASE_URL" -c @"
DROP TRIGGER IF EXISTS trg_set_updated_at ON licenses;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON licenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
"@

Write-Host "Verifying tables..." -ForegroundColor Cyan
& $psqlPath "$env:DATABASE_URL" -c "\dt"

Write-Host "Schema migration completed successfully!" -ForegroundColor Green
