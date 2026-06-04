# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the RBAC system implemented in ALQUIMIA-SLP frontend. The system provides granular permission control for all user actions in the simulator and admin panel.

## Core Components

### 1. Permission Matrix (`src/lib/rbac.ts`)

Defines 11 permissions across 4 user roles:

**Permissions:**
- `view_simulator` - Access the main simulator interface
- `edit_data` - Modify baseline data and parameters
- `upload_documents` - Upload municipal documents
- `manage_users` - Manage user accounts and roles
- `export_reports` - Export reports and scenarios (PDF/XLSX)
- `access_admin_panel` - Access admin management interface
- `view_antecedentes` - View municipal antecedents
- `modify_assumptions` - Modify modeling assumptions
- `create_scenarios` - Create and compare scenarios
- `view_financials` - View financial data and projections

**Roles:**
- **Admin** (10/10 permissions): Full platform access, can manage users, access all features
- **Functionary** (7/10 permissions): Government officials, can edit data, modify assumptions, upload documents, export reports
- **Entrepreneur** (4/10 permissions): Business users, can view simulator, create scenarios, export reports, view financials
- **Citizen** (1/10 permission): Public users, view-only access to simulator

### 2. Hooks

#### `useRBAC()` - Main hook for permission checking
```typescript
const { canViewSimulator, canEditData, userRole, can, canAll, canAny } = useRBAC()

// Check specific permission
if (can('edit_data')) { /* ... */ }

// Check multiple permissions
if (canAll(['edit_data', 'modify_assumptions'])) { /* ... */ }
```

#### `useDataPermissions()` - Data modification gates
```typescript
const { 
  canEditBaseline,
  canEditAssumptions,
  canModifyParameters,
  canCreateScenario,
  canViewFinancialData
} = useDataPermissions()
```

#### `useExportPermissions()` - Export format restrictions
```typescript
const { 
  canExportPDF,
  canExportXLSX,
  canExportJSON,
  getAvailableFormats 
} = useExportPermissions()
```

### 3. Protected Components

#### UI-Level Protection
- `ProtectedContent` - Conditionally render content based on permissions
- `ProtectedButton` - Disable buttons for unauthorized users
- `ProtectedInput` / `ProtectedTextArea` - Form fields with permission checks
- `AccessDenied` - Standard access denied message UI

#### Usage Example
```typescript
<ProtectedContent permissions="edit_data">
  <DataEditingComponent />
</ProtectedContent>

<ProtectedButton permissions={['modify_assumptions']} disabled={loading}>
  Save Assumptions
</ProtectedButton>
```

## Protected Features

### Module-Level Protection

1. **ComparadorEscenarios** - Requires `canCreateScenario`
   - Users without permission see access denied message
   - Cannot create or modify scenario comparisons

2. **InspeccionForm** - Requires `canEditData`
   - Inspection data entry is fully gated
   - Read-only users cannot input inspection records

3. **EditorTrayectoria** - Requires `canEditAssumptions`
   - Capture rate presets are locked for unauthorized users
   - Users can view but not modify trajectory assumptions

4. **Macrogeneradores** - Requires `canEditData`
   - Macro generator creation/modification gated
   - View-only access for non-functionaries

5. **ConsultingExportButton** - Format-based restrictions
   - JSON exports restricted to admin/functionary
   - PDF/XLSX available to entrepreneurs and higher

6. **DocumentUploadSection** (Admin) - Requires `canUploadDocuments`
   - Admin panel document management
   - Functionaries can also upload

7. **Profile Document Upload** (perfil) - Requires `canUploadDocuments`
   - Personal profile document upload for pending gaps
   - Restricted to authorized roles

8. **Admin Panel** (`/admin`) - Requires `access_admin_panel`
   - Full admin interface access control
   - All tabs require admin or equivalent permissions

## Testing

Comprehensive test suite in `src/lib/rbac.test.ts`:
- Permission matrix validation (16 tests)
- Permission checking functions (all/any/has)
- Role-to-audience mapping
- Role hierarchy validation

**Run tests:**
```bash
npm test -- src/lib/rbac.test.ts
# All 16 tests passing
```

## Integration Patterns

### Pattern 1: Component-Level Gating
```typescript
export function DataEditComponent() {
  const { canEditData } = useDataPermissions()
  
  if (!canEditData) {
    return <AccessDenied feature="Data editing requires admin privileges" />
  }
  
  return <EditingForm />
}
```

### Pattern 2: Feature Flag Approach
```typescript
const { can } = useRBAC()

return (
  <div>
    {can('view_antecedentes') && <AntecedentsSection />}
    {can('view_financials') && <FinancialsSection />}
  </div>
)
```

### Pattern 3: Button/Action Protection
```typescript
<button disabled={!canCreateScenario} onClick={createScenario}>
  Create Scenario
</button>
```

## Security Considerations

1. **Client-Side Permission Checks** - UI filtering only
   - Server must validate all operations
   - Client-side checks prevent accidental misuse
   - Never rely on client-side checks alone

2. **Permission Derivation** - From Clerk/Auth0 user roles
   - `audience` field determines initial role mapping
   - Can be overridden by backend configuration
   - Default mapping: `null/unknown` → citizen (most restrictive)

3. **LocalStorage Persistence**
   - User role and permissions not stored in localStorage
   - Calculated fresh on each session from auth token
   - Server-of-truth remains backend authentication

## Configuration

### Adding New Permissions

1. Add to `Permission` type in `rbac.ts`
2. Add to relevant role sets in `ROLE_PERMISSIONS`
3. Create corresponding hook in relevant permission hook file
4. Use in components via new hooks

### Changing Role Permissions

Edit `ROLE_PERMISSIONS` object in `src/lib/rbac.ts`:
```typescript
const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  admin: new Set([/* ... */]),
  functionary: new Set([/* ... */]),
  // ...
}
```

## Audit Logging

Currently, RBAC-protected operations are logged via:
- Admin panel audit log (manual entries)
- Backend API logging (future enhancement)

**Recommended Implementation:**
- Log all permission check failures
- Track sensitive operation attempts
- Maintain audit trail for compliance

## Future Enhancements

1. **Fine-Grained Permissions** - Per-municipality, per-module permissions
2. **Dynamic Roles** - Custom role creation in admin panel
3. **Permission Groups** - Bundle related permissions
4. **Audit Dashboard** - Real-time permission activity tracking
5. **Rate Limiting** - Prevent brute-force permission testing
6. **Session-Based Revocation** - Immediate permission revocation

## Compliance

RBAC system supports compliance with:
- Data protection regulations (role-based data access)
- Multi-user scenarios (clear role definitions)
- Audit requirements (permission tracking framework)
- Least-privilege principle (restrictive defaults)

## Support

For questions or changes to RBAC:
1. Review test cases in `rbac.test.ts`
2. Check `useRBAC` hook for usage patterns
3. Consult protected component implementations
4. Refer to admin panel for role examples
