/*===============================================================
 IT-481 Unit 3 — Roles, Users, and Permissions for Northwind
 Author: Jim Ferencz
 File:  IT481_Unit3_JimFerencz.sql
 Target DB: Northwind (SQL Server)
===============================================================*/

---------------------------------------------
-- 0) Safety + context
---------------------------------------------
IF DB_ID('Northwind') IS NULL
BEGIN
    RAISERROR('Northwind database not found on this instance.', 16, 1);
    RETURN;
END
GO
USE [Northwind];
GO

/* ===============================================================
   1) Create roles (idempotent)
      - role_reporting: read-only to most dbo objects, but NO read of Employees (PII)
      - role_inventory: read/limited update to Products stock columns; NO delete
      - role_sales_entry: can insert Orders and [Order Details]
=================================================================*/
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE type = 'R' AND name = 'role_reporting')
    CREATE ROLE [role_reporting] AUTHORIZATION [dbo];
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE type = 'R' AND name = 'role_inventory')
    CREATE ROLE [role_inventory] AUTHORIZATION [dbo];
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE type = 'R' AND name = 'role_sales_entry')
    CREATE ROLE [role_sales_entry] AUTHORIZATION [dbo];
GO

/* ===============================================================
   2) Modify access for the roles
=================================================================*/

-- 2a) REPORTING: read most things in dbo, but deny Employees (PII example)
GRANT SELECT ON SCHEMA::[dbo] TO [role_reporting];
-- restrict PII:
IF OBJECT_ID('dbo.Employees') IS NOT NULL
    DENY SELECT ON [dbo].[Employees] TO [role_reporting];
-- (Optional) you can similarly DENY other sensitive tables if desired
-- e.g., DENY SELECT ON [dbo].[EmployeeTerritories] TO [role_reporting];

-- 2b) INVENTORY: read Products and update only stock-related columns; no deletes
IF OBJECT_ID('dbo.Products') IS NOT NULL
BEGIN
    GRANT SELECT ON [dbo].[Products] TO [role_inventory];
    GRANT UPDATE (UnitsInStock, UnitsOnOrder, ReorderLevel) ON [dbo].[Products] TO [role_inventory];
    DENY  DELETE ON [dbo].[Products] TO [role_inventory];
END

-- 2c) SALES ENTRY: insert order headers and lines; basic read of Products for lookups
IF OBJECT_ID('dbo.Orders') IS NOT NULL
    GRANT INSERT ON [dbo].[Orders] TO [role_sales_entry];
IF OBJECT_ID('dbo.[Order Details]') IS NOT NULL
    GRANT INSERT ON [dbo].[Order Details] TO [role_sales_entry];

-- Helpful read for product lookups (not strictly required, but practical)
IF OBJECT_ID('dbo.Products') IS NOT NULL
    GRANT SELECT ON [dbo].[Products] TO [role_sales_entry];

GO

/* ===============================================================
   3) Create SQL logins (server-level) (idempotent)
      NOTE: Replace these placeholder passwords before running.
=================================================================*/
-- Use strong passwords that meet your policy (length/complexity)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'u_reporting_login')
    EXEC ('CREATE LOGIN [u_reporting_login] WITH PASSWORD = ''ReplaceMe_Strong1!'', CHECK_POLICY = ON, CHECK_EXPIRATION = ON, DEFAULT_DATABASE = [Northwind];');
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'u_inventory_login')
    EXEC ('CREATE LOGIN [u_inventory_login] WITH PASSWORD = ''ReplaceMe_Strong2!'', CHECK_POLICY = ON, CHECK_EXPIRATION = ON, DEFAULT_DATABASE = [Northwind];');
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'u_sales_login')
    EXEC ('CREATE LOGIN [u_sales_login] WITH PASSWORD = ''ReplaceMe_Strong3!'', CHECK_POLICY = ON, CHECK_EXPIRATION = ON, DEFAULT_DATABASE = [Northwind];');
GO

/* ===============================================================
   4) Create database users mapped to those logins (idempotent)
=================================================================*/
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'u_reporting')
    CREATE USER [u_reporting] FOR LOGIN [u_reporting_login] WITH DEFAULT_SCHEMA = [dbo];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'u_inventory')
    CREATE USER [u_inventory] FOR LOGIN [u_inventory_login] WITH DEFAULT_SCHEMA = [dbo];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'u_sales')
    CREATE USER [u_sales] FOR LOGIN [u_sales_login] WITH DEFAULT_SCHEMA = [dbo];
GO

/* ===============================================================
   5) Add users to roles (idempotent; use ALTER ROLE)
=================================================================*/
IF IS_MEMBER('role_reporting') = 0 -- check current execution context only; we’ll do a robust add anyway
    PRINT 'Adding users to roles...';

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members m
    JOIN sys.database_principals r ON r.principal_id = m.role_principal_id
    JOIN sys.database_principals u ON u.principal_id = m.member_principal_id
    WHERE r.name = 'role_reporting' AND u.name = 'u_reporting'
)
    ALTER ROLE [role_reporting] ADD MEMBER [u_reporting];

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members m
    JOIN sys.database_principals r ON r.principal_id = m.role_principal_id
    JOIN sys.database_principals u ON u.principal_id = m.member_principal_id
    WHERE r.name = 'role_inventory' AND u.name = 'u_inventory'
)
    ALTER ROLE [role_inventory] ADD MEMBER [u_inventory];

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members m
    JOIN sys.database_principals r ON r.principal_id = m.role_principal_id
    JOIN sys.database_principals u ON u.principal_id = m.member_principal_id
    WHERE r.name = 'role_sales_entry' AND u.name = 'u_sales'
)
    ALTER ROLE [role_sales_entry] ADD MEMBER [u_sales];
GO

/* ===============================================================
   6) Verification views — use for screenshots
=================================================================*/

-- 6a) Show roles and memberships
PRINT '--- ROLE MEMBERS ---';
SELECT
    r.name  AS RoleName,
    u.name  AS MemberName
FROM sys.database_role_members m
JOIN sys.database_principals r ON r.principal_id = m.role_principal_id
JOIN sys.database_principals u ON u.principal_id = m.member_principal_id
ORDER BY r.name, u.name;

-- 6b) Show effective grants/denies we set (high-level)
PRINT '--- ROLE PERMISSIONS SNAPSHOT (high-level) ---';
SELECT
    RP.name AS PrincipalName,
    DP.class_desc,
    OBJECT_SCHEMA_NAME(DP.major_id) AS ObjSchema,
    OBJECT_NAME(DP.major_id) AS ObjName,
    DP.permission_name,
    DP.state_desc
FROM sys.database_permissions DP
JOIN sys.database_principals RP ON RP.principal_id = DP.grantee_principal_id
WHERE RP.name IN (N'role_reporting', N'role_inventory', N'role_sales_entry')
ORDER BY RP.name, DP.permission_name, DP.state_desc, ObjSchema, ObjName;

-- 6c) Behavioral tests via EXECUTE AS (no data changes)
PRINT '--- TEST role_reporting (should read Customers, but NOT Employees) ---';
BEGIN TRY
    EXECUTE AS USER = 'u_reporting';
        SELECT TOP 1 CustomerID, CompanyName FROM dbo.Customers;
        PRINT 'u_reporting: Customers SELECT = OK';
        -- Expect failure here:
        BEGIN TRY
            SELECT TOP 1 EmployeeID, LastName FROM dbo.Employees;
            PRINT 'u_reporting: Employees SELECT = UNEXPECTEDLY ALLOWED';
        END TRY
        BEGIN CATCH
            PRINT 'u_reporting: Employees SELECT = DENIED (expected)';
        END CATCH
    REVERT;
END TRY
BEGIN CATCH
    PRINT ERROR_MESSAGE();
    IF (USER_NAME() = 'u_reporting') REVERT;
END CATCH;

PRINT '--- TEST role_inventory (can UPDATE stock cols, cannot DELETE Products) ---';
BEGIN TRY
    EXECUTE AS USER = 'u_inventory';
        -- harmless no-op update (value to itself)
        UPDATE dbo.Products SET UnitsInStock = UnitsInStock WHERE ProductID = 1;
        PRINT 'u_inventory: UPDATE stock columns = OK';

        BEGIN TRY
            DELETE FROM dbo.Products WHERE ProductID = -999; -- won't match; still requires permission
            PRINT 'u_inventory: DELETE Products = UNEXPECTEDLY ALLOWED';
        END TRY
        BEGIN CATCH
            PRINT 'u_inventory: DELETE Products = DENIED (expected)';
        END CATCH
    REVERT;
END TRY
BEGIN CATCH
    PRINT ERROR_MESSAGE();
    IF (USER_NAME() = 'u_inventory') REVERT;
END CATCH;

PRINT '--- TEST role_sales_entry (INSERT rights exist) ---';
BEGIN TRY
    EXECUTE AS USER = 'u_sales';
        SELECT HAS_PERMS_BY_NAME('dbo.Orders','OBJECT','INSERT') AS OrdersInsertPerm,
               HAS_PERMS_BY_NAME('dbo.[Order Details]','OBJECT','INSERT') AS OrderDetailsInsertPerm;
        PRINT 'u_sales: INSERT permissions flags returned (1 = has permission).';
    REVERT;
END TRY
BEGIN CATCH
    PRINT ERROR_MESSAGE();
    IF (USER_NAME() = 'u_sales') REVERT;
END CATCH;

PRINT '--- DONE ---';
