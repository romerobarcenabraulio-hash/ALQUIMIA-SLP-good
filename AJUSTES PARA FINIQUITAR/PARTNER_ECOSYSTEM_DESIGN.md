# PARTNER ECOSYSTEM DESIGN · Arquitectura del programa de partners y network effects defensivos

**Estado:** Propuesto · Pendiente de firma del founder
**Fecha:** 29 mayo 2026
**Activación:** Solo después de 3 contratos directos firmados
**Construye:** KRONOS (backend), POLIS (UI partner dashboard), AUDITOR (calidad), KOSMOS (segmentación de leads)

---

## 1 · Propósito

Diseñar la arquitectura técnica, legal y comercial del programa de partners de Alquimia, con disciplina inviolable de NO activarlo antes de tener 3 contratos directos firmados.

El propósito estratégico del programa es triple. Primero, escalar la cobertura geográfica de México sin abrir oficinas en cada estado. Segundo, construir network effects defensivos donde la competencia tenga que vencer a una red distribuida en lugar de a una empresa central. Tercero, transformar costos fijos (nómina) en costos variables (comisiones) que mejoran la sostenibilidad financiera.

---

## 2 · Principios no negociables

**Disciplina de no activación prematura.** Cero partners firmados antes de 3 contratos directos cerrados por el founder. Sin caso documentado, sin proceso operativo probado, sin métricas reales — los partners destruyen marca en lugar de construirla.

**Cero partners pueden ser dueños de tenants.** Partners actúan en nombre de municipios. No pueden registrar un tenant donde ellos sean el cliente final. Esto previene captura de tenants por partners desleales que después intenten llevarse al municipio a competencia.

**Propiedad intelectual de aprendizaje cross-tenant pertenece a Alquimia.** Cuando un partner trabaja con un municipio, los patrones que el sistema aprende son propiedad de Alquimia, no del partner. Sin esto, partners construyen su propio knowledge base y compiten con Alquimia con datos que Alquimia financió.

**Calidad mínima auditada por AUDITOR.** Partners con métricas debajo del umbral son notificados, capacitados, y eventualmente removidos. No hay partners "intocables" por razones comerciales.

**Asignación de leads no es arbitraria.** Cuando entra un lead, va a partner correcto según reglas explícitas. Sin reglas, hay conflictos de canal y partners se pelean.

---

## 3 · Tres niveles de partner

### 3.1 Nivel uno · Embajador asociado

**Perfil:** consultora local pequeña (1-5 personas) o consultor individual con relaciones específicas en uno o dos municipios.

**Comisión:** 20-30% de la venta inicial + 20-25% de MRR recurrente durante 24 meses.

**Exclusividad:** ninguna. Trabajan en mercado abierto.

**Capacitación:** 1 semana online + certificación básica.

**Acceso a la plataforma:** rol `embajador` con acceso a tenant del cliente como consultor invitado. Sin acceso a Plataforma 0 administrativa.

**Obligaciones:** completar 5 horas mensuales de actualización de capacitación.

**Quitar acceso:** si no genera ventas en 12 meses o si genera quejas formales de clientes.

### 3.2 Nivel dos · Partner certificado

**Perfil:** consultora mediana (5-20 personas) con histórico demostrable de proyectos municipales.

**Comisión:** 35-45% de la venta inicial + 30-35% de MRR recurrente durante 36 meses.

**Exclusividad:** territorial limitada (un estado o 2-3 municipios específicos negociados).

**Capacitación:** 4-6 semanas con certificación que renueva anualmente.

**Acceso a la plataforma:** rol `partner_certified` con dashboard propio en Plataforma 0 mostrando solo sus tenants. Ve comisiones acumuladas, próximos cobros, métricas de calidad.

**Obligaciones:**
- Mantener mínimo 80% de tasa de cierre de gates G1 en sus tenants
- Generar mínimo 2 ventas por año
- Contribuir trimestralmente a knowledge base con patrones detectados
- Participar en reuniones de calidad mensuales

**Quitar acceso:** métricas <80% durante 2 trimestres consecutivos, o quejas formales repetidas.

### 3.3 Nivel tres · Partner estratégico

**Perfil:** consultora grande (20+ personas), firma de auditoría con presencia nacional, o consultora con relaciones excepcionales con gobiernos estatales.

**Comisión:** 45-55% de la venta inicial + 40-50% de MRR recurrente durante 48 meses.

**Exclusividad:** regional (una o varias regiones del país).

**Capacitación:** maestra continua. Certificación renovable. Co-desarrollo de capabilities específicas.

**Acceso a la plataforma:** rol `partner_strategic` con acceso amplio a Plataforma 0 incluyendo gestión de sus tenants, configuración de capabilities personalizadas, dashboards ejecutivos.

**Obligaciones:**
- Mantener 85%+ de tasa de cierre G1
- Generar mínimo 8 ventas por año
- Co-marketing con Alquimia
- Comprometer ejecutivo dedicado a relación

**Quitar acceso:** decisión conjunta del founder y consejo asesor cuando exista.

---

## 4 · Estructura económica

### 4.1 Repartos por configuración

Asumiendo MRR cliente Tier Operación Completa de $60,000 MXN/mes ($720,000 anual):

**Configuración A (sin partner):** Alquimia $720k/año.

**Configuración B (embajador nivel 1):** Alquimia $510-575k/año, embajador $145-210k/año. Alquimia retiene 70-80%.

**Configuración C (partner certificado nivel 2):** Alquimia $470-505k/año, partner $215-250k/año. Alquimia retiene 65-70%.

**Configuración D (partner estratégico nivel 3):** Alquimia $360-430k/año, partner $290-360k/año. Alquimia retiene 50-60%.

### 4.2 Justificación de mayor share a partner estratégico

Aunque parece contraintuitivo, los partners estratégicos generan ventas que Alquimia nunca cerraría sola. Si un partner estratégico cierra 8 ventas/año que Alquimia no habría cerrado, 50% de $720k × 8 = $2.88M/año para Alquimia, versus $0 sin el partner.

Además, los partners estratégicos suelen tener relaciones con gobierno estatal y federal que abren mercados completos. Un partner que conecta a Alquimia con la SHCP o el BID puede generar valor que ningún esfuerzo directo del founder puede replicar.

### 4.3 Bonos y aceleradores

Adicional a comisiones base:

**Bono de aceleración:** partners que excedan su cuota anual reciben +10% adicional sobre el excedente.

**Bono de retención:** si un cliente del partner renueva al término del año 1, partner recibe bono equivalente a un mes de MRR.

**Bono de expansion:** si el cliente del partner activa capabilities adicionales (rutas, tesorería, etc.), partner recibe 25% del MRR adicional durante 12 meses.

**Bono de calidad:** partner con métricas top 10% recibe +5% sobre todas sus comisiones del trimestre.

---

## 5 · Arquitectura técnica del programa de partners

### 5.1 Schema de tablas nuevas

```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name VARCHAR(200) NOT NULL,
  trade_name VARCHAR(200),
  rfc VARCHAR(13) NOT NULL UNIQUE,
  contact_person_name VARCHAR(200),
  contact_email VARCHAR(200),
  contact_phone VARCHAR(20),
  fiscal_address JSONB,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('embajador', 'certified', 'strategic')),
  certification_status VARCHAR(20) DEFAULT 'pending',
  certification_expires_at TIMESTAMPTZ,
  territory_exclusivity JSONB,
  base_commission_pct_initial NUMERIC(5,2),
  base_commission_pct_recurring NUMERIC(5,2),
  recurring_commission_months INT,
  signed_at TIMESTAMPTZ,
  contract_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  termination_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE partner_tenant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  tenant_id UUID REFERENCES tenants(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('originated', 'co-managed', 'inherited')),
  commission_override_pct NUMERIC(5,2),
  active BOOLEAN DEFAULT TRUE,
  ended_at TIMESTAMPTZ,
  end_reason TEXT
);

CREATE TABLE partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  tenant_id UUID REFERENCES tenants(id),
  source_payment_id UUID,
  amount_mxn NUMERIC(12,2) NOT NULL,
  commission_type VARCHAR(30) CHECK (commission_type IN ('initial_sale', 'recurring_monthly', 'expansion', 'retention_bonus', 'quality_bonus', 'acceleration_bonus')),
  period_month DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
  cfdi_url VARCHAR(500),
  paid_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE partner_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  measurement_period VARCHAR(7),  -- 'YYYY-MM'
  gates_g1_closed INT DEFAULT 0,
  gates_g1_failed INT DEFAULT 0,
  avg_days_to_first_g1 NUMERIC(8,2),
  client_nps_avg NUMERIC(3,1),
  client_complaints_count INT DEFAULT 0,
  contributions_to_knowledge_base INT DEFAULT 0,
  quality_score NUMERIC(5,2),
  computed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Sistema de assignment de leads

```typescript
async function assignLeadToPartner(lead: {
  email: string
  municipio: string
  estado: string
  inegi_clave: string
}): Promise<{ assigned_to: 'partner' | 'founder', partner_id?: string }> {

  // Regla 1: si existe partner estratégico con exclusividad en el estado, asigna a él
  const strategicPartner = await db.partners.findFirst({
    where: {
      tier: 'strategic',
      status: 'active',
      territory_exclusivity: { path: ['estados'], array_contains: lead.estado }
    }
  })
  if (strategicPartner) return { assigned_to: 'partner', partner_id: strategicPartner.id }

  // Regla 2: si existe partner certificado con exclusividad en el municipio, asigna
  const certifiedPartner = await db.partners.findFirst({
    where: {
      tier: 'certified',
      status: 'active',
      territory_exclusivity: { path: ['municipios'], array_contains: lead.inegi_clave }
    }
  })
  if (certifiedPartner) return { assigned_to: 'partner', partner_id: certifiedPartner.id }

  // Regla 3: si no hay partner exclusivo, lead va al founder
  return { assigned_to: 'founder' }
}
```

### 5.3 Dashboard de partner en Plataforma 0

Cuando un partner accede a `/admin` con su cuenta, ve interfaz adaptada a su rol:

**Para embajador (nivel 1):**
- Lista de sus tenants asignados (read-only)
- Pipeline de leads próximos a contactar
- Comisiones acumuladas
- Calendario de capacitaciones

**Para partner certificado (nivel 2):**
- Todo lo anterior +
- Métricas de calidad propias
- Comparación contra benchmark de partners
- Botón "Solicitar capability adicional para mi tenant"
- Reportes de progreso por tenant

**Para partner estratégico (nivel 3):**
- Todo lo anterior +
- Configuración de capabilities en sus tenants
- Co-marketing tools (assets, talking points)
- Acceso a dashboards ejecutivos agregados
- Reunión mensual de planeación con founder

### 5.4 Captura de insights del partner

Cada partner contribuye trimestralmente a knowledge base con:

```typescript
interface PartnerInsight {
  partner_id: string
  quarter: string  // '2026-Q3'
  insight_type: 'pattern' | 'risk' | 'opportunity' | 'best_practice'
  description: string
  affected_modules: string[]
  evidence: string[]  // referencias a tenants donde se observó
  recommended_action: string
  reviewed_by_alquimia: boolean
  incorporated_to_system: boolean
}
```

Estos insights alimentan a NOUS y se anonimizan antes de propagarse a otros tenants. Partners que contribuyen insights valiosos reciben reconocimiento y bonos.

---

## 6 · Protecciones legales y contractuales

### 6.1 Cláusulas inviolables del contrato de partner

**Cláusula uno · No réplica de metodología.** Partner no puede construir herramienta propia que replique funcionalidades de Alquimia durante la vigencia del contrato y 36 meses después de terminación.

**Cláusula dos · Confidencialidad cross-tenant.** Partner no puede compartir información de un tenant con otro tenant ni con terceros.

**Cláusula tres · Propiedad intelectual de aprendizajes.** Todo patrón, insight o aprendizaje derivado del uso de la plataforma es propiedad de Alquimia, sin importar quién lo identificó originalmente.

**Cláusula cuatro · No solicitación de clientes.** Partner no puede ofrecer servicios alternativos a Alquimia a clientes que conoció a través del programa.

**Cláusula cinco · Responsabilidad por trabajo de campo.** Partner es responsable por la calidad del trabajo de campo y entregables específicos. Alquimia es responsable por la plataforma y metodología base.

**Cláusula seis · Causales de terminación inmediata:**
- Quejas formales de cliente por mala calidad
- Violación de confidencialidad
- Intento de replicar metodología Alquimia
- Métricas debajo del umbral durante 2 trimestres
- Insolvencia o problemas legales del partner

### 6.2 Estructura fiscal

Pagos a partners requieren:

**Para partners persona moral:** CFDI por servicios profesionales emitido por el partner a Alquimia. IVA acreditable 16%. Retención ISR 10% (régimen general).

**Para partners persona física con actividad empresarial:** CFDI por servicios profesionales. IVA 16%. Retención ISR + IVA según régimen.

**Cumplimiento COFECE:** exclusividad territorial debe ser razonable. La COFECE puede objetar contratos exclusivos en mercados donde Alquimia tenga posición dominante. Para los primeros 50 contratos no es tema, pero diseñar con flexibilidad.

### 6.3 Plantilla de contrato de partner

Tres anexos obligatorios además del contrato principal:

**Anexo A · Cláusulas inviolables** (las seis del 6.1)

**Anexo B · Esquema de comisiones detallado** según tier

**Anexo C · Estándares de calidad y proceso de remediación**

Contrato firmado vía Mifiel con e.firma SAT, igual que contratos con clientes.

---

## 7 · Network effects defensivos

### 7.1 Cómo los partners crean defensibilidad

Cuando Alquimia tiene 20 partners distribuidos en México:

- Competidor nuevo que entra al mercado debe convencer no solo al municipio sino también al partner local
- Partner ya tiene contrato con Alquimia y depende económicamente de él
- Partner ha invertido tiempo en capacitación específica de Alquimia
- Partner tiene metodología enseñada por Alquimia, no por competidor
- Costo de cambio para el partner es alto y creciente

Esto convierte a Alquimia de "empresa con producto" a "red con producto." La red es lo que vuelve irreplicable el modelo.

### 7.2 Asimetría intencional con partners financieros

Tipo especial de partner: **partners financieros estratégicos**. No son consultoras sino instituciones que conectan municipios con financiamiento (banca de desarrollo, fondos verdes, fondos sostenibles).

Cuando Alquimia es aceptada como herramienta elegible por NAFIN, BID, BANOBRAS, CAF para sus líneas de crédito verde, los municipios necesitan Alquimia para acceder a recursos. Eso transforma a Alquimia de proveedor opcional a infraestructura financiera.

Estos acuerdos toman 12-18 meses de trabajo pero generan defensibilidad estructural cuando se concretan. Reservado para Sprint 4 del proyecto.

---

## 8 · Criterios binarios de cierre

Programa de partners está listo para activación cuando:

1. Alquimia tiene 3 contratos directos firmados
2. Documentación de proceso operativo probado (lecciones de los 3 contratos)
3. Schemas de tablas implementados
4. Sistema de assignment de leads funcional
5. Dashboard de partner construido para los tres niveles
6. Contrato de partner revisado por abogado mexicano especializado
7. Plantilla en Mifiel lista
8. Sistema de captura de insights operativo
9. Métricas de calidad definidas y medibles
10. Primer partner candidato identificado y en proceso de certificación

---

## 9 · Cronograma sugerido

| Momento | Acción |
|---|---|
| Mes 0-3 | Cerrar 3 contratos directos. NO activar partners. |
| Mes 3-4 | Documentar proceso operativo. Construir backend de partners. |
| Mes 4-5 | Reclutar primer partner nivel 2 (certified) en estado distinto al de los primeros 3 clientes. |
| Mes 5-6 | Certificar primer partner. Asignar primer lead. Acompañar primera venta del partner. |
| Mes 6-12 | Escalar a 5 partners certificados. Comenzar reclutamiento de primer partner estratégico. |
| Mes 12-18 | 10-15 partners distribuidos. Primer acuerdo con institución financiera. |
| Mes 18-24 | 20+ partners. Network effects defensivos visibles. |

---

## 10 · Documentos relacionados

- `ADR-0010_stage_based_platform_separation.md`
- `BILLING_CONTRACTS_LIFECYCLE.md` — pagos a partners siguen lógica similar
- `PLATAFORMA_0_BACKOFFICE_SPEC.md` — dashboard de partner vive ahí
- `LEARNING_AND_FEEDBACK_LAYER.md` — partners contribuyen a NOUS

---

## 11 · Aprobación

```
[ ] Founder
[ ] Abogado mexicano especializado en derecho corporativo
[ ] Contador certificado para estructura fiscal
[ ] AUDITOR · proceso de calidad de partners
```

Sin estas cuatro firmas, el programa de partners NO se activa, sin importar las presiones comerciales.

---

*PARTNER ECOSYSTEM DESIGN · Alquimia · 29 mayo 2026*
