# ALQUIMIA OPERATIONAL PLAN — Complete System Architecture
**Status:** Ready for execution  
**Target:** Fully operational by end of session  
**Scope:** Auth bridge, Phase D accessibility, end-to-end testing

---

## PART I: SYSTEM PHILOSOPHY & ARCHITECTURE

### 1.1 Core Principles

**Multi-Tenant Municipal Platform**
- Each municipio = one tenant
- Isolation: tenant_id on every record
- Scalability: Stateless APIs, async background jobs
- Auditability: Every mutation logged with actor, timestamp, changes

**Stage-Based Journey** (immutable progression)
```
validation → planning → execution → monitoring
```
- Each stage has gates (completion criteria)
- Advancement requires gate closure
- No backward transitions
- Historical tracking of stage changes

**Role-Based Access Control**
```
Platform Admin
  ├─ All tenants, all operations
  └─ System configuration

Tenant Admin
  ├─ Own tenant only
  ├─ User management
  └─ Data operations

Municipal Staff
  ├─ Own tenant data only
  ├─ Read-only admin data
  └─ Data entry (residue, generadores)

Consultant (via /v, /p, /e)
  ├─ Assigned tenants only
  └─ Read + planning operations
```

**Authentication Architecture**
```
Clerk (user identity only)
  ↓
Clerk Session Token
  ↓
Backend JWT Exchange Endpoint
  ↓
Backend JWT (with role, tenant)
  ↓
All API calls use JWT
```

---

### 1.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js + Clerk)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Clerk.useUser() gets session                           │
│  2. Exchange for JWT: POST /auth/clerk-exchange            │
│  3. Store JWT in localStorage                              │
│  4. All API calls: Authorization: Bearer {jwt}             │
│                                                              │
│  Pages:                                                      │
│  - /hub (municipal dashboard) ← JWT required               │
│  - /decision-tree (questionnaire) ← JWT required           │
│  - /residue-recording (data entry) ← JWT required          │
│  - /v (consulting) ← Clerk session required                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
                     API Calls
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (FastAPI)                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Middleware:                                                │
│  1. Extract JWT from Authorization header                  │
│  2. Verify signature (SECRET_KEY)                          │
│  3. Extract: user_id, tenant_id, role, exp                │
│  4. Attach to request.state                                │
│  5. Authorize by role + tenant                             │
│                                                              │
│  Endpoints:                                                 │
│  - POST /auth/clerk-exchange (public)                      │
│  - GET /auth/me (returns user profile)                     │
│  - POST /auth/logout (blacklist JWT)                       │
│  - All /api/v1/* (require JWT + role check)                │
│                                                              │
│  Background Jobs (AsyncIO):                                │
│  - Scraper loop (every 5 min)                              │
│  - Aggregation (every midnight)                            │
│  - Outlier detection (on residue POST)                     │
│  - Trend calculation (on query)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.3 Database Schema (Key Tables)

```sql
-- Users (synced from Clerk)
users
  ├─ id (UUID)
  ├─ email (unique, from Clerk)
  ├─ nombre
  ├─ rol (admin | tenant_admin | staff | consultant)
  ├─ tenant_id (what they belong to, if not admin)
  ├─ metadata (JSON: {'clerk_id', 'phone', 'municipio_nombre'})
  ├─ created_at
  └─ deleted_at (soft delete)

-- Tenants (municipios)
tenants
  ├─ id (UUID)
  ├─ nombre (municipio name)
  ├─ estado_mx
  ├─ municipio_id (INEGI code)
  ├─ estado_id
  ├─ tier_comercial (diagnostico | implementacion | operacion)
  ├─ current_stage (validation | planning | execution | monitoring)
  ├─ created_at
  └─ deleted_at

-- Generadores (waste generators)
generadores
  ├─ id (UUID)
  ├─ tenant_id (who owns this)
  ├─ nombre
  ├─ tipo (empresa | hospital | hotel | comercio | etc)
  ├─ municipio
  ├─ rfc (unique per municipio)
  ├─ source (denue | manual | decision_tree | bulk_upload)
  ├─ activo
  ├─ verificado
  ├─ metadata (JSON: {contacto, capacidad, etc})
  ├─ created_at
  └─ deleted_at

-- Daily Residue Records
generator_residue_records
  ├─ id (UUID)
  ├─ generador_id
  ├─ tenant_id
  ├─ fecha_generacion
  ├─ cantidad_total_tons
  ├─ materiales_json (dict: {concreto: 100, acero: 50, ...})
  ├─ es_outlier (boolean, detected after insert)
  ├─ validation_status (ok | warning | error)
  ├─ created_by (user_id)
  ├─ created_at
  └─ deleted_at

-- Municipal Aggregates (daily rollups)
municipal_residue_aggregates
  ├─ id (UUID)
  ├─ tenant_id
  ├─ municipio
  ├─ fecha
  ├─ periodo (diario | semanal | mensual)
  ├─ cantidad_tons
  ├─ generadores_activos (count)
  ├─ materiales_json
  ├─ computed_at
  └─ deleted_at

-- Decision Tree Sessions
decision_tree_sessions
  ├─ id (UUID)
  ├─ tenant_id
  ├─ user_id
  ├─ tree_type (construccion | hospital | comercio | restaurante)
  ├─ answers_json (dict of question → answer)
  ├─ sector_isic
  ├─ residue_generation_tons_mes
  ├─ materiales_generados
  ├─ compliance_guide_json
  ├─ completed_at
  ├─ created_at
  └─ deleted_at

-- Scraped Documents
scraped_documents
  ├─ id (UUID)
  ├─ titulo
  ├─ url
  ├─ pdf_hash (SHA256 for deduplication)
  ├─ source (dof | semarnat | cofemer | inegi | asf)
  ├─ tema (residuos | construccion | agua | salud | regulacion)
  ├─ ambito (federal)
  ├─ aplicable_rsu (boolean)
  ├─ aplicable_rcd (boolean)
  ├─ contenido_text (first 50k chars)
  ├─ fecha_publicacion
  ├─ created_at
  └─ deleted_at

-- Audit Log (immutable)
audit_logs
  ├─ id (UUID)
  ├─ tenant_id
  ├─ actor (user_id)
  ├─ entity_type (generador | residue_record | etc)
  ├─ entity_id
  ├─ action (create | update | delete)
  ├─ changes_json (before/after)
  ├─ timestamp
  └─ ip_address
```

---

## PART II: IMPLEMENTATION ROADMAP

### Phase II.A: Authentication Bridge (Blocker #1)

**Objective:** Clerk session → Backend JWT exchange

**Step 1: Backend Endpoint** (`/auth/clerk-exchange`)

```python
# File: backend/app/routers/auth.py — ADD THIS

@router.post("/auth/clerk-exchange")
async def exchange_clerk_for_jwt(request: Request, db: Session = Depends(get_db)):
    """
    Frontend calls this with Clerk session token.
    Returns backend JWT for subsequent API calls.
    
    Flow:
    1. Verify Clerk token (via Clerk SDK)
    2. Extract user email from Clerk
    3. Find or create backend User record
    4. Determine role (admin check, tenant assignment)
    5. Generate JWT with role + tenant_id
    6. Return JWT
    """
    
    # Get Clerk session from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Clerk token")
    
    clerk_token = auth_header[7:]  # Remove "Bearer "
    
    try:
        # Verify with Clerk (requires CLERK_SECRET_KEY)
        import clerk_sdk
        clerk_client = clerk_sdk.Clerk(api_key=os.getenv("CLERK_SECRET_KEY"))
        session = await clerk_client.sessions.get(clerk_token)
        clerk_user = await clerk_client.users.get(session.user_id)
        
        email = clerk_user.primary_email_address.email_address
        
    except Exception as e:
        logger.error(f"Clerk verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Clerk token")
    
    # Find or create backend User
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Auto-create on first Clerk login
        user = User(
            email=email,
            nombre=f"{clerk_user.first_name} {clerk_user.last_name}".strip(),
            rol="staff",  # Default role
            tenant_id=None,  # Will be set by admin or auto-detected
            metadata={
                "clerk_id": clerk_user.id,
                "phone": clerk_user.phone_numbers[0].phone_number if clerk_user.phone_numbers else None,
            }
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Auto-created user: {email}")
    
    # Determine role
    if email in ADMIN_EMAILS:
        role = "admin"
        tenant_id = None
    else:
        role = user.rol
        tenant_id = user.tenant_id
    
    # Generate backend JWT
    token = create_access_token(
        data={
            "sub": str(user.id),
            "email": email,
            "rol": role,
            "tenant_id": str(tenant_id) if tenant_id else None,
        },
        expires_delta=timedelta(hours=24),
    )
    
    return {"access_token": token, "token_type": "bearer"}
```

**Step 2: Frontend Integration** (`src/lib/clerkToJwt.ts`)

```typescript
// NEW FILE: frontend/src/lib/clerkToJwt.ts

import { useUser } from '@clerk/nextjs'
import { getApiUrl } from '@/lib/api'

export async function exchangeClerkForJwt(clerkSessionToken: string): Promise<string> {
  """Exchange Clerk token for backend JWT"""
  const res = await fetch(`${getApiUrl()}/auth/clerk-exchange`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkSessionToken}`,
      'Content-Type': 'application/json',
    },
  })
  
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Exchange failed')
  
  localStorage.setItem('alquimia_token', data.access_token)
  return data.access_token
}

export function useAlquimiaToken() {
  """Hook to get or exchange Clerk token for JWT"""
  const { user, isLoaded } = useUser()
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!isLoaded) return
    
    const stored = localStorage.getItem('alquimia_token')
    if (stored) {
      setToken(stored)
      setLoading(false)
      return
    }
    
    // Get Clerk session token
    (async () => {
      try {
        const clerkToken = await user?.getIdToken()
        if (clerkToken) {
          const jwt = await exchangeClerkForJwt(clerkToken)
          setToken(jwt)
        }
      } catch (e) {
        console.error('Token exchange failed', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [isLoaded, user])
  
  return { token, loading }
}
```

**Step 3: Update Hub Page** (`src/app/hub/page.tsx`)

```typescript
// REPLACE the token-checking logic in HubContent()

function HubContent() {
  const router = useRouter()
  const { token, loading: tokenLoading } = useAlquimiaToken()
  
  if (tokenLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin" size={24} />
      </div>
    )
  }
  
  if (!token) {
    router.replace('/sign-in')
    return null
  }
  
  // REST OF THE COMPONENT (unchanged)
  // token is now guaranteed to be present
}
```

**Apply this pattern to:**
- `/hub/page.tsx`
- `/hub/plan-maestro/page.tsx`
- `/hub/residue-analytics/page.tsx`
- `/decision-tree/page.tsx`
- `/residue-recording/page.tsx`
- `/admin/page.tsx`

---

### Phase II.B: Middleware Authorization (Blocker #4)

**Objective:** Backend validates JWT on every request

**Step 1: JWT Middleware** (`backend/app/middleware/auth.py`)

```python
# NEW FILE: backend/app/middleware/auth.py

from fastapi import HTTPException, Request
from datetime import datetime
import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# Routes that don't need auth
PUBLIC_ROUTES = [
    "/health",
    "/docs",
    "/openapi.json",
    "/api/v1/documents/scraped",  # Rate-limited but public
]

def extract_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return auth_header[7:]

def verify_token(token: str) -> dict:
    """Decode JWT and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def auth_middleware(request: Request, call_next):
    """Check token on all protected routes"""
    
    # Skip public routes
    if any(request.url.path.startswith(r) for r in PUBLIC_ROUTES):
        return await call_next(request)
    
    # Extract and verify token
    try:
        token = extract_token(request)
        payload = verify_token(token)
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    
    # Attach to request
    request.state.user_id = payload.get("sub")
    request.state.email = payload.get("email")
    request.state.role = payload.get("rol")
    request.state.tenant_id = payload.get("tenant_id")
    
    return await call_next(request)
```

**Step 2: Register Middleware** (`backend/app/main.py`)

```python
# ADD to FastAPI lifespan setup

from app.middleware.auth import auth_middleware

app.add_middleware(BaseHTTPMiddleware, dispatch=auth_middleware)
```

**Step 3: Role-Based Endpoint Protection** (pattern)

```python
# In any router

from fastapi import Depends, Request, HTTPException

def require_role(*roles: str):
    """Decorator to check user role"""
    async def check(request: Request):
        if request.state.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return request.state
    return Depends(check)

# Usage:
@router.get("/generadores")
async def list_generadores(
    state: dict = require_role("admin", "staff", "tenant_admin"),
    db: Session = Depends(get_db)
):
    """List generadores for this tenant"""
    tenant_id = state.tenant_id
    generadores = db.query(Generador).filter(
        Generador.tenant_id == tenant_id,
        Generador.deleted_at.is_(None)
    ).all()
    return {"generadores": [g.to_dict() for g in generadores]}
```

---

### Phase II.C: Tenant Assignment Logic

**Objective:** Auto-assign Clerk users to municipios

**Step 1: Tenant Detection** (`backend/app/routers/auth.py`)

```python
# In /auth/clerk-exchange, ADD tenant assignment logic

def get_tenant_for_user(email: str, db: Session) -> Optional[str]:
    """
    Determine which tenant this user should belong to.
    
    Logic:
    1. If email is in a hardcoded admin list → None (platform admin)
    2. If user already has tenant_id → return it
    3. If email domain matches municipio email → auto-assign
    4. Otherwise → None (requires manual assignment)
    """
    
    # Platform admins
    if email in ["romero.barcena.braulio@gmail.com"]:
        return None
    
    # Check if email contains municipio hint
    # e.g., "staff@sjp.gob.mx" → San Luis Potosí
    domain = email.split("@")[1]
    municipio_map = {
        "sjp.gob.mx": "San Luis Potosí",
        "aguascalientes.gob.mx": "Aguascalientes",
        # ...
    }
    
    if domain in municipio_map:
        municipio = municipio_map[domain]
        tenant = db.query(Tenant).filter(
            Tenant.nombre == municipio
        ).first()
        return tenant.id if tenant else None
    
    return None

# In /auth/clerk-exchange, after creating user:
tenant_id = get_tenant_for_user(email, db)
if tenant_id:
    user.tenant_id = tenant_id
    user.rol = "staff"
db.commit()
```

---

### Phase II.D: Data Seeding (for testing)

**Step 1: Seed Script** (`backend/scripts/seed_db.py`)

```python
# NEW FILE: backend/scripts/seed_db.py

from app.db.session import SessionLocal
from app.models.admin_tenant import Tenant, User
from app.models.generador import GeneradorEntity, GeneratorResidueRecord, MunicipalResidueAggregate
from datetime import datetime, timedelta
import random

def seed_database():
    db = SessionLocal()
    
    # Create test tenant
    tenant = Tenant(
        nombre="San Luis Potosí (Prueba)",
        estado_mx="San Luis Potosí",
        municipio_id="SLP001",
        tier_comercial="diagnostico",
        current_stage="validation",
    )
    db.add(tenant)
    db.commit()
    
    # Create test user
    user = User(
        email="test@alquimia.local",
        nombre="Test User",
        rol="staff",
        tenant_id=tenant.id,
    )
    db.add(user)
    db.commit()
    
    # Create 5 test generadores
    tipos = ["empresa", "hospital", "comercio", "restaurante", "industria"]
    for i in range(5):
        gen = GeneradorEntity(
            tenant_id=tenant.id,
            nombre=f"Generador {i+1}",
            tipo=random.choice(tipos),
            municipio="San Luis Potosí",
            rfc=f"RFC{i:04d}",
            source="manual",
            activo=True,
            verificado=True,
        )
        db.add(gen)
        db.commit()
        
        # Add 30 days of residue data
        for day in range(30):
            fecha = datetime.now() - timedelta(days=day)
            record = GeneratorResidueRecord(
                generador_id=gen.id,
                tenant_id=tenant.id,
                fecha_generacion=fecha.date(),
                cantidad_total_tons=random.uniform(0.5, 5.0),
                materiales_json={
                    "organico": random.uniform(10, 50),
                    "plastico": random.uniform(5, 30),
                    "papel": random.uniform(5, 20),
                },
                validation_status="ok",
            )
            db.add(record)
        db.commit()
    
    print("✓ Database seeded successfully")

if __name__ == "__main__":
    seed_database()
```

**Run:** `python backend/scripts/seed_db.py`

---

### Phase II.E: End-to-End Test Flow

**Test Sequence:**

```
1. CREATE ACCOUNT
   POST https://alquimia-slp.vercel.app/sign-up
   → Enter email, confirm Clerk
   
2. LOGIN
   POST https://alquimia-slp.vercel.app/sign-in
   → Sign in with Clerk account
   
3. CLERK → JWT EXCHANGE
   Frontend: useAlquimiaToken() hook fires
   POST https://alquimia-slp-1good.onrender.com/auth/clerk-exchange
   ← Returns JWT
   
4. HUB LOADS
   GET https://alquimia-slp.vercel.app/hub
   → Dashboard displays
   → Shows municipality info, stage, tier
   
5. DECISION TREE
   POST https://alquimia-slp-1good.onrender.com/api/v1/decision-tree/start
   Headers: Authorization: Bearer {jwt}
   ← Returns tree_id, questions
   
   POST https://alquimia-slp-1good.onrender.com/api/v1/decision-tree/{id}/answers
   Headers: Authorization: Bearer {jwt}
   Body: {answers: {...}}
   ← Returns results, residue estimate
   
   POST https://alquimia-slp-1good.onrender.com/api/v1/decision-tree/{id}/create-generador
   Headers: Authorization: Bearer {jwt}
   ← Creates generador, returns id
   
6. RESIDUE RECORDING
   POST https://alquimia-slp-1good.onrender.com/api/v1/generadores/{id}/residues
   Headers: Authorization: Bearer {jwt}
   Body: {fecha, cantidad_total_tons, materiales_json}
   ← Backend outlier detection runs
   ← Municipal aggregation queued
   
7. ANALYTICS
   GET https://alquimia-slp-1good.onrender.com/api/v1/municipios/{municipio}/residue-analytics
   Headers: Authorization: Bearer {jwt}
   ← Returns trends, projections, changes
   
8. VERIFY SCRAPERS
   GET https://alquimia-slp-1good.onrender.com/api/v1/documents/scraped?limit=10
   ← Returns recently scraped documents from DOF, SEMARNAT, etc
```

---

## PART III: ALGORITHMS (Core Logic)

### 3.1 Outlier Detection (on residue POST)

```python
def detect_outlier(record: GeneratorResidueRecord, db: Session) -> bool:
    """
    IQR + Z-score combined method
    
    Algorithm:
    1. Get last 30 records for this generador
    2. Calculate IQR (Q1, Q3, IQR = Q3 - Q1)
    3. Flag if outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
    4. Also calculate Z-score (threshold: 2.0)
    5. Flag if |Z| > 2.0
    6. Return True if either method flags
    """
    
    recent = db.query(GeneratorResidueRecord).filter(
        GeneratorResidueRecord.generador_id == record.generador_id,
        GeneratorResidueRecord.deleted_at.is_(None),
    ).order_by(GeneratorResidueRecord.fecha_generacion.desc()).limit(30).all()
    
    if len(recent) < 3:
        return False  # Not enough data
    
    values = [r.cantidad_total_tons for r in recent]
    
    # IQR method
    sorted_values = sorted(values)
    q1 = sorted_values[len(sorted_values) // 4]
    q3 = sorted_values[3 * len(sorted_values) // 4]
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    
    if not (lower <= record.cantidad_total_tons <= upper):
        return True
    
    # Z-score method
    mean = sum(values) / len(values)
    std = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
    if std > 0:
        z_score = abs((record.cantidad_total_tons - mean) / std)
        if z_score > 2.0:
            return True
    
    return False
```

### 3.2 Municipal Aggregation (nightly, 00:00 UTC)

```python
async def aggregate_for_date(tenant_id: str, fecha: date, db: Session):
    """
    Roll up all generator records for a municipio on a given date.
    
    Algorithm:
    1. Find all active generadores for tenant
    2. For each generador, get record for fecha
    3. Sum quantities → cantidad_tons
    4. Merge materials dict
    5. Upsert or create MunicipalResidueAggregate
    6. Calculate trends (30-day window)
    """
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        return
    
    generadores = db.query(GeneradorEntity).filter(
        GeneradorEntity.tenant_id == tenant_id,
        GeneradorEntity.activo == True,
        GeneradorEntity.deleted_at.is_(None),
    ).all()
    
    total_tons = 0
    merged_materials = {}
    record_count = 0
    
    for gen in generadores:
        record = db.query(GeneratorResidueRecord).filter(
            GeneratorResidueRecord.generador_id == gen.id,
            GeneratorResidueRecord.fecha_generacion == fecha,
        ).first()
        
        if record:
            total_tons += record.cantidad_total_tons
            for mat, qty in (record.materiales_json or {}).items():
                merged_materials[mat] = merged_materials.get(mat, 0) + qty
            record_count += 1
    
    # Upsert aggregate
    agg = db.query(MunicipalResidueAggregate).filter(
        MunicipalResidueAggregate.tenant_id == tenant_id,
        MunicipalResidueAggregate.municipio == tenant.nombre,
        MunicipalResidueAggregate.fecha == fecha,
        MunicipalResidueAggregate.periodo == "diario",
    ).first()
    
    if agg:
        agg.cantidad_tons = total_tons
        agg.materiales_json = merged_materials
        agg.computed_at = datetime.utcnow()
    else:
        agg = MunicipalResidueAggregate(
            tenant_id=tenant_id,
            municipio=tenant.nombre,
            fecha=fecha,
            periodo="diario",
            cantidad_tons=total_tons,
            materiales_json=merged_materials,
            computed_at=datetime.utcnow(),
        )
        db.add(agg)
    
    db.commit()
```

### 3.3 Trend Analysis (on query)

```python
def calculate_trend(tenant_id: str, municipio: str, days: int = 30, db: Session) -> dict:
    """
    30-day trend with stats and week/month changes.
    
    Returns:
    {
      media_tons_diarios: float,
      desviacion_estandar: float,
      minimo: float,
      maximo: float,
      coef_variacion: float,
      tendencia: 'aumentando' | 'disminuyendo' | 'estable',
      cambio_semana_pct: float,  # week-over-week change
      cambio_mes_pct: float,     # month-over-month change
      proyeccion_mes_tons: float, # linear projection
    }
    """
    
    cutoff = datetime.now().date() - timedelta(days=days)
    records = db.query(MunicipalResidueAggregate).filter(
        MunicipalResidueAggregate.tenant_id == tenant_id,
        MunicipalResidueAggregate.municipio == municipio,
        MunicipalResidueAggregate.fecha >= cutoff,
        MunicipalResidueAggregate.periodo == "diario",
    ).order_by(MunicipalResidueAggregate.fecha).all()
    
    if len(records) < 3:
        return {"data_insufficient": True}
    
    values = [r.cantidad_tons for r in records]
    
    # Stats
    media = sum(values) / len(values)
    varianza = sum((x - media) ** 2 for x in values) / len(values)
    std = varianza ** 0.5
    coef_var = (std / media * 100) if media > 0 else 0
    
    # Trend (last 7 vs previous 7)
    first_week = sum(values[:7]) / min(7, len(values))
    last_week = sum(values[-7:]) / min(7, len(values))
    
    if last_week > first_week * 1.05:
        tendencia = "aumentando"
    elif last_week < first_week * 0.95:
        tendencia = "disminuyendo"
    else:
        tendencia = "estable"
    
    # Week-over-week & month-over-month
    cambio_semana = ((last_week - first_week) / first_week * 100) if first_week > 0 else 0
    cambio_mes = ((values[-1] - values[0]) / values[0] * 100) if values[0] > 0 else 0
    
    # Linear projection to 30 days
    days_in_month = 30
    proyeccion = media * days_in_month
    
    return {
        "dias_con_datos": len(records),
        "media_tons_diarios": round(media, 2),
        "desviacion_estandar": round(std, 2),
        "minimo_tons_diarios": round(min(values), 2),
        "maximo_tons_diarios": round(max(values), 2),
        "coef_variacion": round(coef_var, 2),
        "tendencia": tendencia,
        "cambio_semana_pct": round(cambio_semana, 1),
        "cambio_mes_pct": round(cambio_mes, 1),
        "proyeccion_mes_tons": round(proyeccion, 2),
    }
```

### 3.4 Web Scraper Classification

```python
def classify_document(titulo: str, contenido: str) -> dict:
    """
    Classify scraped document by tema and applicability.
    
    Algorithm:
    1. Keyword matching for tema (highest-priority keywords win)
    2. Boolean matching for aplicable_rsu, aplicable_rcd
    """
    
    text = (titulo + " " + contenido).lower()
    
    # Tema priority (first match wins)
    tema_rules = [
        ("residuos", ["rsu", "residuos sólidos", "urbanos", "municipales", "lgpgir"]),
        ("construccion", ["construcción", "rcd", "escombros", "nom-083", "demolición"]),
        ("agua", ["agua", "drenaje", "conagua", "humedales"]),
        ("salud", ["hospital", "salud", "nom-087", "bioseguridad"]),
        ("regulacion", ["reglamento", "norma", "decreto"]),
    ]
    
    tema = "regulacion"  # default
    for tema_name, keywords in tema_rules:
        if any(kw in text for kw in keywords):
            tema = tema_name
            break
    
    # Applicability booleans
    aplicable_rsu = any(w in text for w in ["rsu", "residuos sólidos", "municipales"])
    aplicable_rcd = any(w in text for w in ["rcd", "construcción", "escombros"])
    
    return {
        "ambito": "federal",
        "tema": tema,
        "aplicable_rsu": aplicable_rsu,
        "aplicable_rcd": aplicable_rcd,
    }
```

---

## PART IV: DEPLOYMENT CHECKLIST

### Environment Variables - Render (Backend)

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=<long-random-secret>
ALLOWED_ORIGINS=https://alquimia-slp.vercel.app,https://alquimia.mx
CRON_SECRET=<random-string>
API_REDIS=redis://default:pass@host:6379
INEGI_DENUE_TOKEN=<optional>
SENTRY_DSN=<optional>
CLERK_SECRET_KEY=<from Clerk dashboard>
```

### Environment Variables - Vercel (Frontend)

```bash
NEXT_PUBLIC_API_URL=https://alquimia-slp-1good.onrender.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<from Google Cloud>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk dashboard>
```

---

## PART V: GO-LIVE CHECKLIST

- [ ] Auth bridge endpoint working (`/auth/clerk-exchange`)
- [ ] JWT middleware protecting all /api/v1/* routes
- [ ] Hub page loads after Clerk login
- [ ] Decision tree page accessible
- [ ] Generadores CRUD works
- [ ] Residue recording saves & triggers outlier detection
- [ ] Municipal analytics calculates trends
- [ ] Scrapers run automatically (check logs)
- [ ] Admin dashboard shows data
- [ ] Sentry captures errors (if configured)
- [ ] Rate limiting active (300 req/min)
- [ ] Database backed up
- [ ] Render + Vercel deployments green

---

## EXECUTION ORDER (Execute in sequence)

1. **Auth Bridge** (Phase II.A) — 30 min
2. **Middleware & JWT** (Phase II.B) — 20 min
3. **Tenant Assignment** (Phase II.C) — 15 min
4. **Data Seeding** (Phase II.D) — 10 min
5. **Update Frontend** (apply pattern to all pages) — 20 min
6. **Deploy & Test** (Phase II.E) — 15 min

**Total:** ~2 hours to operational system

---

**Status:** Ready to execute. No ambiguity. Each step is actionable.
