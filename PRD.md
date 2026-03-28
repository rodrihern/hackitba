# Product Requirements Document (PRD)
## Plataforma de Colaboraciones Marca-Creador

---

## 1. Visión del Producto

### 1.1 Descripción General
Plataforma web desktop-first que conecta marcas con creadores de contenido mediante un sistema integrado de colaboraciones, gamificación y recompensas. La experiencia de usuario está inspirada en plataformas como Airbnb/BigBox, priorizando cards visuales y navegación intuitiva.

### 1.2 Propuesta de Valor

**Para Marcas:**
- Descubrir y conectar con creadores de contenido
- Lanzar campañas de marketing (canjes y retos)
- Gestionar contenido generado por usuarios
- Construir comunidades leales mediante sistema de puntos

**Para Usuarios/Creadores:**
- Construir un portfolio público profesional
- Participar en campañas de marcas
- Ganar puntos y recompensas
- Avanzar en sistema de niveles gamificado

---

## 2. Arquitectura Técnica

### 2.1 Stack Tecnológico

**Frontend:**
- **Framework:** Next.js (App Router)
- **UI Library:** React
- **State Management:** Zustand o React Query
- **Styling:** Tailwind CSS
- **Design Pattern:** Cards estilo Airbnb

**Backend:**
- **BaaS:** Supabase
  - Autenticación
  - Base de datos PostgreSQL
  - Storage (media opcional)
  - Edge Functions (lógica compleja/IA)

**IA/ML:**
- **Servicio:** Edge Function server-side
- **Input:** Prompt de búsqueda de marca
- **Output:** Lista rankeada de usuarios por relevancia

---

## 3. Usuarios y Permisos

### 3.1 Tipos de Usuario

#### Marca
**Características:**
- Cuenta única por empresa
- Acceso completo a funcionalidades de gestión

**Capacidades:**
- Crear campañas (canjes/retos)
- Explorar marketplace de creadores
- Invitar usuarios específicos
- Puntuar entregas de contenido
- Definir y gestionar recompensas
- Configurar tienda de puntos

#### Usuario/Creador
**Características:**
- Tipo único (sin diferenciación de rol)
- Incluye: usuarios comunes, microinfluencers, influencers
- Diferenciación mediante **sistema de niveles dinámico**

**Capacidades:**
- Construir portfolio público
- Aplicar a campañas
- Participar en retos
- Acumular puntos por marca
- Canjear recompensas
- Seguir marcas

---

## 4. Sistema de Niveles

### 4.1 Niveles Disponibles
- **Bronze** (0-50 puntos)
- **Silver** (50-150 puntos)
- **Gold** (150-300 puntos)
- **Platinum** (300-600 puntos)
- **Diamond** (600+ puntos)

### 4.2 Variables de Cálculo
- Cantidad de canjes obtenidos
- Cantidad de campañas completadas
- Cantidad de puntos acumulados (global, todas las marcas)
- Cantidad de seguidores (Instagram + TikTok)
- Cantidad de veces seleccionado por marcas

### 4.3 Fórmula MVP

```
score = 
  (canjes × 5) +
  (retos_completados × 3) +
  (puntos_totales ÷ 100) +
  (followers_total ÷ 1000) +
  (veces_seleccionado × 4)
```

**Rangos:**
- 0–50 → Bronze
- 50–150 → Silver
- 150–300 → Gold
- 300–600 → Platinum
- 600+ → Diamond

---

## 5. Modelo de Datos

### 5.1 Users
```sql
- id (PK)
- email (unique)
- password_hash
- role (enum: 'brand' | 'user')
- created_at
```

### 5.2 UserProfiles
```sql
- id (PK)
- user_id (FK → Users)
- username (unique)
- bio
- profile_image
- instagram_url
- tiktok_url
- youtube_url
- followers_instagram
- followers_tiktok
- followers_youtube
- total_points (global)
- level (enum)
- created_at
```

### 5.3 BrandProfiles
```sql
- id (PK)
- user_id (FK → Users)
- name
- description
- logo
- industry
- created_at
```

### 5.4 Campaigns
```sql
- id (PK)
- brand_id (FK → BrandProfiles)
- type (enum: 'exchange' | 'challenge')
- title
- description
- status (enum: 'draft' | 'active' | 'closed')
- created_at
```

### 5.5 Exchanges (Canjes)
```sql
- id (PK)
- campaign_id (FK → Campaigns)
- requirements (jsonb)
- reward_description
- reward_type (enum: 'product' | 'money' | 'both')
- money_amount (decimal)
- product_description
- slots (int)
- deadline (timestamp)
```

### 5.6 ExchangeApplications
```sql
- id (PK)
- exchange_id (FK → Exchanges)
- user_id (FK → UserProfiles)
- status (enum: 'applied' | 'invited' | 'accepted' | 'rejected')
- proposal_text
- created_at
```

### 5.7 Challenges
```sql
- id (PK)
- campaign_id (FK → Campaigns)
- is_multi_day (boolean)
- total_days (int)
- has_leaderboard (boolean)
- max_winners (int)
- scoring_type (enum: 'manual')
```

### 5.8 ChallengeDays
```sql
- id (PK)
- challenge_id (FK → Challenges)
- day_number (int)
- title
- description
- content_type (enum: 'video' | 'image' | 'text' | 'link')
- instructions
```

### 5.9 ChallengeSubmissions
```sql
- id (PK)
- challenge_id (FK → Challenges)
- day_id (FK → ChallengeDays)
- user_id (FK → UserProfiles)
- submission_url
- submission_text
- score (int 1-100)
- created_at
```

### 5.10 BrandPoints
```sql
- id (PK)
- brand_id (FK → BrandProfiles)
- user_id (FK → UserProfiles)
- points (int)
```
**Nota:** Los puntos son específicos por marca, no globales.

### 5.11 Rewards
```sql
- id (PK)
- brand_id (FK → BrandProfiles)
- title
- description
- points_cost (int)
- money_cost (decimal)
- reward_type (enum: 'product' | 'discount' | 'experience')
```

### 5.12 Redemptions
```sql
- id (PK)
- reward_id (FK → Rewards)
- user_id (FK → UserProfiles)
- points_used (int)
- money_paid (decimal)
- created_at
```

### 5.13 Follows
```sql
- id (PK)
- user_id (FK → UserProfiles)
- brand_id (FK → BrandProfiles)
- created_at
```

### 5.14 Invitations
```sql
- id (PK)
- brand_id (FK → BrandProfiles)
- user_id (FK → UserProfiles)
- campaign_id (FK → Campaigns)
- type (enum: 'exchange')
- status (enum: 'pending' | 'accepted' | 'rejected')
- created_at
```

---

## 6. Flujos de Usuario Detallados

### 6.1 Marca Crea un Canje

**Pasos:**
1. Marca accede a dashboard
2. Click en "Crear campaña"
3. Selecciona tipo: **Canje**
4. Completa formulario:
   - Título
   - Descripción
   - Requisitos (followers, categoría, etc.) → JSON
   - Tipo de recompensa (producto/dinero/ambos)
   - Monto $ (si aplica)
   - Descripción del producto
   - Cantidad de slots disponibles
   - Fecha límite
5. Submit → **Estado: draft**
6. Marca revisa y publica → **Estado: active**

**Resultado:** Canje visible en marketplace para usuarios.

---

### 6.2 Usuario Aplica a Canje

**Pasos:**
1. Usuario navega listado de canjes
2. Ve card de canje (título, marca, recompensa)
3. Click → ver detalle completo
4. Click "Aplicar"
5. Completa formulario:
   - Mensaje/propuesta personalizada
6. Submit → **Estado: applied**

**Resultado:** Aplicación registrada, marca puede revisarla.

---

### 6.3 Marca Invita Usuario Directo

**Pasos:**
1. Marca accede a marketplace de creadores
2. Aplica filtros (nivel, seguidores, etc.)
3. Click en perfil de usuario
4. Click "Invitar a canje"
5. Selecciona campaña activa
6. Confirma invitación

**Resultado:** Se crea registro en tabla `Invitations` con estado `pending`.

---

### 6.4 Marca Selecciona Participantes

**Pasos:**
1. Marca accede a "Applicants" de campaña
2. Revisa lista de aplicaciones
3. Click en usuario → ver perfil completo
4. Decide: **Accept** o **Reject**

**Resultado:** 
- `Accept` → estado cambia a **accepted**
- `Reject` → estado cambia a **rejected**

---

### 6.5 Usuario Completa Canje

**Pasos:**
1. Usuario recibe notificación de aceptación
2. Crea contenido (post, video, etc.)
3. Publica en red social
4. Regresa a plataforma → sube link de publicación
5. Marca valida manualmente el cumplimiento

**Resultado:** Marca marca como completado, usuario recibe recompensa.

---

### 6.6 Marca Crea Reto

**Pasos:**
1. Marca → "Crear campaña"
2. Selecciona tipo: **Challenge**
3. Configuración general:
   - Nombre
   - Descripción
   - Multi-day: **true/false**
   - Leaderboard: **true**
   - Cantidad de ganadores
4. Si multi-day, configura cada día:
   - Día 1, 2, 3... N
   - Por cada día:
     - Título
     - Instrucciones específicas
     - Tipo de contenido esperado (video/imagen/texto/link)
5. Submit → **Estado: draft**
6. Publica → **Estado: active**

**Resultado:** Reto visible, usuarios pueden participar.

---

### 6.7 Usuario Participa en Reto

**Pasos:**
1. Usuario ve reto en listado
2. Click → detalle del reto
3. Click "Participar"
4. **Día 1 se desbloquea automáticamente**
5. Para cada día:
   - Usuario accede al día activo
   - Lee instrucciones
   - Sube contenido:
     - Link a publicación
     - Archivo (opcional)
     - Texto descriptivo
   - Submit → se guarda `ChallengeSubmission`
6. Al completar Día N, se desbloquea Día N+1

**Resultado:** Submissions guardadas, marca puede puntuar.

---

### 6.8 Scoring y Leaderboard

**Pasos:**
1. Marca accede a "Submissions" del reto
2. Revisa cada submission por usuario/día
3. Asigna **score manual** (1-100)
4. Sistema suma score total por usuario:
   ```sql
   SELECT user_id, SUM(score) as total_score
   FROM ChallengeSubmissions
   WHERE challenge_id = ?
   GROUP BY user_id
   ORDER BY total_score DESC
   ```
5. Leaderboard se actualiza **en tiempo real**

**Resultado:** Ranking visible para usuarios y marca.

---

### 6.9 Asignación de Puntos

**Proceso Automático:**
- Por cada `ChallengeSubmission` con score asignado:
  ```
  BrandPoints[brand_id][user_id] += score
  ```
- Puntos se acumulan **por marca** (no globales)

**Resultado:** Usuario ve puntos acumulados en cada marca.

---

### 6.10 Canje de Puntos

**Pasos:**
1. Usuario accede a "Tienda" de marca específica
2. Ve listado de `Rewards` disponibles
3. Click en recompensa → detalle
4. Click "Canjear"
5. Sistema valida:
   ```
   if (user_points >= points_cost) {
     // Canje exitoso
   } else {
     // Opción de pagar diferencia con $
   }
   ```
6. Se crea registro en `Redemptions`
7. Puntos se deducen de `BrandPoints`

**Resultado:** Usuario canjea recompensa, marca gestiona entrega.

---

## 7. Marketplace de Creadores

### 7.1 Filtros Disponibles
- **Followers:** rango mínimo/máximo
- **Nivel:** Bronze, Silver, Gold, Platinum, Diamond
- **Categoría:** fitness, tech, beauty, etc.
- **Engagement:** mock (alto/medio/bajo)
- **Plataformas:** Instagram, TikTok, YouTube
- **Ubicación:** país/ciudad (opcional)

### 7.2 IA Matching

**Input (Marca):**
```
"Busco fitness influencers con engagement alto en Argentina, 
 entre 10k-50k seguidores en Instagram"
```

**Procesamiento Backend (Edge Function):**
1. Parse del prompt usando LLM
2. Conversión a query estructurada:
   ```json
   {
     "category": "fitness",
     "engagement": "high",
     "location": "Argentina",
     "followers_instagram": { "min": 10000, "max": 50000 }
   }
   ```
3. Búsqueda en DB con scoring
4. Ranking por relevancia

**Output:**
```json
[
  { "user_id": 123, "match_score": 95 },
  { "user_id": 456, "match_score": 87 },
  ...
]
```

---

## 8. Sistema de Notificaciones

### 8.1 Triggers

| Evento | Receptor | Descripción |
|--------|----------|-------------|
| Nueva campaña | Usuario (followers de marca) | "Marca X lanzó nueva campaña" |
| Invitación a canje | Usuario específico | "Marca X te invitó a un canje" |
| Aceptación | Usuario | "Tu aplicación fue aceptada" |
| Rechazo | Usuario | "Tu aplicación fue rechazada" |
| Nuevo día desbloqueado | Usuario participante | "Día 2 del reto está disponible" |
| Puntuación recibida | Usuario | "Recibiste 85 puntos de Marca X" |

### 8.2 Implementación
- **MVP:** Notificaciones in-app (tabla `Notifications`)
- **Futuro:** Email, push notifications

---

## 9. Pantallas Principales

### 9.1 Usuario/Creador

| Pantalla | Descripción |
|----------|-------------|
| **Home** | Feed de campañas activas (canjes + retos) |
| **Marketplace** | Explorar marcas y campañas |
| **Perfil Público** | Portfolio con métricas, submissions, nivel |
| **Mis Campañas** | Canjes/retos activos y completados |
| **Mis Puntos** | Desglose de puntos por marca |
| **Tienda** | Rewards disponibles por marca |
| **Notificaciones** | Centro de notificaciones |

### 9.2 Marca

| Pantalla | Descripción |
|----------|-------------|
| **Dashboard** | Overview de campañas, métricas, actividad |
| **Crear Campaña** | Wizard para canjes/retos |
| **Mis Campañas** | Gestión de campañas activas/pasadas |
| **Applicants** | Revisar aplicaciones y submissions |
| **Marketplace** | Explorar creadores (con IA matching) |
| **Perfil Usuario** | Vista detallada de creador (portfolio) |
| **Tienda Config** | Gestionar rewards y redemptions |

---

## 10. API Endpoints

### 10.1 Autenticación
```
POST /auth/signup
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### 10.2 Campañas
```
POST /campaigns              # Crear campaña
GET  /campaigns              # Listar campañas (filtros)
GET  /campaigns/:id          # Detalle de campaña
PATCH /campaigns/:id/status  # Cambiar estado (draft/active/closed)
```

### 10.3 Canjes (Exchanges)
```
POST /exchanges                    # Crear canje
GET  /exchanges                    # Listar canjes
POST /exchanges/:id/apply          # Usuario aplica
POST /exchanges/:id/invite         # Marca invita usuario
POST /applications/:id/accept      # Marca acepta aplicación
POST /applications/:id/reject      # Marca rechaza aplicación
```

### 10.4 Retos (Challenges)
```
POST /challenges                   # Crear reto
GET  /challenges/:id               # Detalle de reto
POST /challenges/:id/join          # Usuario se une
POST /challenges/:id/submit        # Usuario envía submission
GET  /challenges/:id/leaderboard   # Ver ranking
PATCH /submissions/:id/score       # Marca asigna score
```

### 10.5 Puntos
```
GET  /brands/:id/points            # Puntos de usuario en marca
POST /points/add                   # Sistema suma puntos
GET  /users/:id/points             # Todos los puntos del usuario
```

### 10.6 Recompensas
```
GET  /brands/:id/rewards           # Listar rewards de marca
POST /rewards                      # Crear reward
POST /rewards/:id/redeem           # Usuario canjea
GET  /redemptions                  # Historial de canjes
```

### 10.7 Marketplace
```
GET  /users/search                 # Búsqueda con filtros
POST /users/search/ai              # Búsqueda con IA
GET  /users/:id/profile            # Perfil público
```

---

## 11. Reglas de Negocio Clave

### 11.1 Puntos
- **Los puntos son específicos por marca** (no intercambiables)
- Se acumulan automáticamente al recibir score en submissions
- Se deducen al canjear rewards

### 11.2 Leaderboard
- Se actualiza **en tiempo real** al asignar scores
- Ordenado por `SUM(score) DESC`
- Empates se resuelven por `created_at` más temprano

### 11.3 Retos Multi-day
- Días se desbloquean **progresivamente**
- Usuario debe completar Día N para acceder a Día N+1
- No se puede saltar días

### 11.4 Autonomía de Marca
- Marca define TODO: puntos, premios, reglas de campañas
- Marca tiene control total de aceptación/rechazo

### 11.5 Aplicaciones Abiertas
- **Usuarios pueden aplicar aunque no cumplan requisitos exactos**
- Marca decide finalmente (permite descubrimiento)

---

## 12. Edge Cases

### 12.1 Usuario Aplica y Luego es Invitado
**Escenario:** Usuario aplica a canje, luego marca lo invita.

**Comportamiento:**
- Si ya aplicó con estado `applied` → cambiar a `invited`
- Notificar usuario de la invitación
- No duplicar registros

### 12.2 Usuario No Completa Todos los Días
**Escenario:** Usuario participa en reto multi-day pero abandona.

**Comportamiento:**
- Submissions hasta ese momento siguen válidas
- No aparece en leaderboard si no completó mínimo requerido (definido por marca)
- Puntos acumulados hasta el abandono se mantienen

### 12.3 Empate en Leaderboard
**Escenario:** Dos usuarios con mismo score total.

**Criterio de desempate:**
1. Mayor score en último día
2. Si persiste empate: `created_at` más temprano (primera submission)

### 12.4 Usuario Sin Puntos Intenta Canjear
**Escenario:** Puntos insuficientes para reward.

**Comportamiento:**
- Mostrar modal: "Te faltan X puntos"
- Opción: "Pagar diferencia con dinero" (solo MVP mock, sin pago real)
- Bloquear canje si no acepta pagar

### 12.5 Marca Cambia Reglas Mid-Campaign
**Restricción:** 
- **BLOQUEADO** una vez que campaña está `active`
- Solo puede cerrar (`closed`) prematuramente
- Requiere crear nueva campaña para cambios

---

## 13. Alcance del MVP

### 13.1 Incluido

✅ Sistema completo de canjes  
✅ Sistema completo de retos (multi-day + leaderboard)  
✅ Marketplace con filtros y búsqueda IA  
✅ Sistema de niveles dinámico  
✅ Puntos por marca + tienda de rewards  
✅ Notificaciones in-app  
✅ Perfiles públicos (portfolio)  

### 13.2 Excluido del MVP

❌ **Integraciones reales con redes sociales**  
   - Sin OAuth de Instagram/TikTok  
   - Sin scraping automático de métricas  
   - Datos de followers ingresados manualmente  

❌ **Pagos reales**  
   - Sin integración con Stripe/MercadoPago  
   - Flujo de pago es mock/simulado  

❌ **Logística de envíos**  
   - Sin tracking de envíos de productos  
   - Coordinación manual marca-usuario  

❌ **Moderación automática**  
   - Sin detección de contenido inapropiado  
   - Sin verificación automática de cumplimiento  
   - Validación manual por marca  

---

## 14. Métricas de Éxito (KPIs)

### 14.1 Métricas de Marca
- Cantidad de campañas creadas
- Tasa de aceptación de aplicaciones
- Tiempo promedio de respuesta a applicants
- ROI de campañas (engagement generado)

### 14.2 Métricas de Usuario
- Tasa de aplicación a canjes
- Tasa de completitud en retos multi-day
- Progresión de niveles (Bronze → Diamond)
- Puntos acumulados por marca

### 14.3 Métricas de Plataforma
- MAU (Monthly Active Users)
- Cantidad de submissions por campaña
- Tasa de conversión (aplicación → aceptación)
- Tiempo promedio en plataforma

---

## 15. Roadmap Post-MVP

### Fase 2
- Integración OAuth redes sociales
- Analytics avanzados para marcas
- Sistema de mensajería marca-usuario

### Fase 3
- Pagos reales (Stripe/MP)
- Sistema de reseñas marca ↔ usuario
- Moderación automática con IA

### Fase 4
- App móvil nativa
- Programa de referidos
- Verificación de cuentas (badge)

---

## 16. Consideraciones de Diseño UX

### 16.1 Principios
- **Desktop-first:** optimizado para pantallas grandes
- **Card-based:** contenido en cards visuales (inspiración Airbnb)
- **Claridad:** CTAs prominentes, jerarquía visual clara
- **Feedback:** estados de carga, confirmaciones, errores claros

### 16.2 Componentes Clave
- **CampaignCard:** título, marca, tipo, recompensa, deadline
- **UserCard:** avatar, username, nivel, followers, engagement
- **LeaderboardRow:** posición, usuario, score, progreso
- **RewardCard:** imagen, título, costo en puntos, disponibilidad

---

## 17. Seguridad y Privacidad

### 17.1 Autenticación
- Passwords hasheados (bcrypt)
- JWT para sesiones
- Refresh tokens

### 17.2 Autorización
- Row Level Security (RLS) en Supabase
- Marca solo ve sus campañas
- Usuario solo ve sus puntos/submissions

### 17.3 Datos Sensibles
- Email no público
- Followers/métricas opcionales (usuario decide)
- Submissions solo visibles para marca y participante

---

## Apéndices

### A. Glosario
- **Canje:** colaboración 1:1 marca-usuario (producto/$ por contenido)
- **Reto:** competencia gamificada con múltiples participantes
- **Submission:** entrega de contenido en reto
- **Score:** puntuación 1-100 asignada por marca
- **Nivel:** clasificación dinámica del usuario (Bronze-Diamond)
- **BrandPoints:** puntos específicos por marca

### B. Referencias de Diseño
- Airbnb (cards, spacing, tipografía)
- BigBox (marketplace, filtros)
- Duolingo (gamificación, leaderboard)

---

**Versión:** 1.0  
**Fecha:** 2026-03-28  
**Estado:** Draft para desarrollo MVP
