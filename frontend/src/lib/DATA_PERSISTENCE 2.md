# Data Persistence & Multi-User Sync Documentation

## Overview

Sprint 7 implements a robust data persistence layer enabling:
- **Persistent Storage**: Save and restore simulation states across sessions
- **Version Control**: Track changes and restore previous versions
- **Multi-User Support**: Share simulations, manage ownership
- **Auto-Save**: Automatic periodic saving of work
- **Conflict Resolution**: Handle simultaneous edits gracefully

## Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────┐
│      UI Components                      │
│  (SimulationPersistencePanel)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Hook Layer                         │
│  (useSimulationPersistence)             │
│  - State management                     │
│  - Auto-save logic                      │
│  - Lifecycle handling                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      API Layer                          │
│  (simulationPersistence.ts)             │
│  - REST endpoints                       │
│  - Error handling                       │
│  - Authentication                       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Backend                            │
│  - PostgreSQL storage                   │
│  - Version management                   │
│  - Permission enforcement               │
└─────────────────────────────────────────┘
```

## API Specification

### Save Simulation
```
POST /simulations/save
Content-Type: application/json
Authorization: Bearer {token}
x-tenant-id: {tenantId}

Request:
{
  "name": "Baseline 2024",
  "description": "Initial configuration",
  "state": { /* serialized state */ }
}

Response (200):
{
  "id": "sim_abc123",
  "version": 1,
  "savedAt": "2024-06-04T17:45:00Z"
}

Error (400):
{
  "detail": "Simulation name is required"
}

Error (409):
{
  "detail": "Simulation already exists. Use update endpoint instead."
}
```

### Load Simulation
```
GET /simulations/{id}
Authorization: Bearer {token}
x-tenant-id: {tenantId}

Response (200):
{
  "id": "sim_abc123",
  "version": 3,
  "state": { /* restored state */ },
  "metadata": {
    "id": "sim_abc123",
    "name": "Baseline 2024",
    "description": "Initial configuration",
    "municipios": ["slp-capital"],
    "horizonte": 10,
    "createdAt": "2024-06-01T10:00:00Z",
    "updatedAt": "2024-06-04T17:45:00Z",
    "createdBy": "user@example.com",
    "updatedBy": "user@example.com",
    "isOwner": true,
    "canEdit": true
  },
  "loadedAt": "2024-06-04T17:50:00Z"
}

Error (404):
{
  "detail": "Simulation not found"
}

Error (403):
{
  "detail": "You do not have permission to access this simulation"
}
```

### List Simulations
```
GET /simulations?page=1&page_size=10
Authorization: Bearer {token}
x-tenant-id: {tenantId}

Response (200):
{
  "simulations": [
    {
      "id": "sim_abc123",
      "name": "Baseline 2024",
      "municipios": ["slp-capital"],
      "horizonte": 10,
      "createdAt": "2024-06-01T10:00:00Z",
      "updatedAt": "2024-06-04T17:45:00Z",
      "createdBy": "user@example.com",
      "updatedBy": "user@example.com",
      "isOwner": true,
      "canEdit": true
    },
    ...
  ],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

### Get Version History
```
GET /simulations/{id}/versions
Authorization: Bearer {token}
x-tenant-id: {tenantId}

Response (200):
{
  "versions": [
    {
      "version": 3,
      "createdAt": "2024-06-04T17:45:00Z",
      "createdBy": "user@example.com",
      "description": "Updated assumptions"
    },
    {
      "version": 2,
      "createdAt": "2024-06-03T14:20:00Z",
      "createdBy": "user@example.com",
      "description": null
    },
    {
      "version": 1,
      "createdAt": "2024-06-01T10:00:00Z",
      "createdBy": "user@example.com",
      "description": null
    }
  ]
}
```

### Restore Version
```
POST /simulations/{id}/restore/{version}
Authorization: Bearer {token}
x-tenant-id: {tenantId}

Response (200):
{
  "id": "sim_abc123",
  "version": 4,
  "state": { /* restored to version 2 state */ },
  "metadata": { ... },
  "loadedAt": "2024-06-04T18:00:00Z"
}
```

### Delete Simulation
```
DELETE /simulations/{id}
Authorization: Bearer {token}
x-tenant-id: {tenantId}

Response (204):
(no content)

Error (403):
{
  "detail": "You can only delete simulations you own"
}
```

## Frontend Usage

### Basic Usage
```typescript
import { useSimulationPersistence } from '@/hooks/useSimulationPersistence'

function MyComponent() {
  const {
    saveStatus,
    lastSaveTime,
    saveCurrentSimulation,
    loadCurrentSimulation,
    simulations,
  } = useSimulationPersistence({ tenantId: 'my-tenant' })

  return (
    <div>
      {saveStatus === 'saving' && <p>Saving...</p>}
      {saveStatus === 'saved' && <p>Saved!</p>}
      <button onClick={() => saveCurrentSimulation('My Sim')}>
        Save
      </button>
    </div>
  )
}
```

### With Auto-Save
```typescript
const { saveStatus, error } = useSimulationPersistence({
  tenantId: 'my-tenant',
  autoSaveInterval: 30000, // Auto-save every 30 seconds
})
```

### Full Example with UI
```typescript
import { SimulationPersistencePanel } from '@/components/simulator/SimulationPersistencePanel'

export function SimulatorPage() {
  return (
    <div>
      <SimulationPersistencePanel 
        tenantId="my-tenant"
        autoSaveInterval={30000}
      />
      {/* Other simulator components */}
    </div>
  )
}
```

## State Serialization

Only serializable state is persisted to avoid issues with circular references:

```typescript
const SERIALIZABLE_KEYS = [
  'zmActiva',
  'municipiosActivos',
  'horizonte',
  'audience',
  'journeyMode',
  'resultados',
  'propuestaSlots',
  'pctCapturaPorAño',
  'presetTrayectoria',
  'preciosMaterial',
  'opexLogistica',
  'moduleProgression',
  'antecedentesReportaje',
]
```

Non-serializable data (functions, refs, etc.) are reinitialized on load.

## Auto-Save Mechanism

1. **Change Detection**: Hash comparison of serialized state
2. **Debouncing**: Configurable interval (default 30 seconds)
3. **Non-Intrusive**: Runs in background, doesn't block user
4. **Silent Errors**: Logs but doesn't disrupt UX
5. **Requires Active Simulation**: Only saves if simulation ID exists

## Conflict Resolution

### Strategy: Last-Write-Wins (LWW)
- Simple, predictable behavior
- No merge conflicts
- Clear winner based on timestamp

### Future: Operational Transformation
- Merge simultaneous changes
- Preserve non-conflicting edits
- More complex implementation

## Multi-User Features

### Permissions
- **Owner**: Full access (read, write, delete, share)
- **Shared User**: Configurable read/write access
- **Public**: Read-only view (optional)

### Sharing Model
```
Simulation Owner
  ├─ Can view, edit, delete, share
  └─ Can revoke access
  
Shared User
  ├─ Can view
  ├─ Can edit (if granted)
  └─ Cannot share further
```

## Testing

### Unit Tests (Planned)
- State serialization
- Change detection
- Error handling
- Hook state transitions

### Integration Tests (Planned)
- Save/load cycle
- Version restoration
- Permission checks
- Concurrent edits

## Security Considerations

1. **Authentication**: Bearer token validation
2. **Authorization**: Owner/shared user checks
3. **Data Privacy**: No cross-tenant data access
4. **Input Validation**: State size limits
5. **Rate Limiting**: Prevent save flooding

## Performance

### Optimizations
- **Debounced Auto-Save**: Prevents excessive API calls
- **State Hashing**: Only saves on actual changes
- **Lazy Loading**: Load versions on demand
- **Pagination**: Limit list results
- **Compression**: Consider gzip for large states

### Benchmarks (Targets)
- Save: < 500ms
- Load: < 300ms
- List: < 200ms
- Auto-save overhead: < 5% CPU

## Future Enhancements

1. **Real-Time Sync**: WebSocket for live updates
2. **Collaborative Editing**: Multiple users editing simultaneously
3. **Advanced Versioning**: Branching, tagging
4. **Audit Trail**: Full change history
5. **Data Export**: Multiple formats (JSON, CSV, PDF)
6. **Time-Machine UI**: Visual diff and restore interface
7. **Conflict Merge**: AI-assisted conflict resolution

## Troubleshooting

### "Save failed" Error
- Check network connectivity
- Verify authentication token
- Check user has write permission
- Verify state size < 5MB

### "Simulation not found"
- Confirm simulation ID is correct
- Check sharing permissions
- Verify user has read access

### Auto-save not working
- Check interval is > 0
- Confirm simulation ID is set
- Check for console errors
- Verify network connectivity

## API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (deleted) |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate name) |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

## Code Examples

See `src/hooks/useSimulationPersistence.ts` and `src/components/simulator/SimulationPersistencePanel.tsx` for complete examples.
