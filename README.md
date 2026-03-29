# HackitBA / CollabSpace

Plataforma de colaboraciones entre marcas y creadores construida con Next.js y Supabase. El proyecto tiene dos experiencias principales: una para creadores que exploran campañas, aplican a canjes y participan en retos; y otra para marcas que crean campañas, revisan postulaciones y administran recompensas.

Deploy activo: https://hackitba-collabspace.vercel.app/

## Qué incluye

- Landing pública con acceso a registro e inicio de sesión.
- Autenticación con Supabase para usuarios tipo `user` y `brand`.
- Bootstrap automático de perfiles a partir de `auth.users`.
- Dashboard de creador con campañas activas, progreso por nivel y postulaciones.
- Dashboard de marca con métricas, campañas recientes y accesos rápidos.
- Creación de campañas de tipo `exchange` y `challenge`.
- Formularios dinámicos para aplicaciones a canjes.
- Marketplace de creadores, tienda de recompensas, perfil, puntos y notificaciones.
- Esquema y migraciones de Supabase versionadas dentro del repo.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase Auth + Postgres
- TypeScript

## Estructura principal

```text
app/                  Rutas App Router para landing, auth, user y brand
components/           Componentes UI reutilizables
lib/                  Contexto auth, cliente Supabase, mappers y servicios
supabase/migrations/  Migraciones SQL del proyecto
docs/schema.md        Referencia del esquema actual
PRD.md                Documento funcional del producto
```

## Requisitos

- Node.js 20+ recomendado
- npm
- Un proyecto de Supabase con Auth y base de datos PostgreSQL


## Flujos implementados

### Creadores

- Registro e inicio de sesión
- Home con campañas activas
- Exploración de campañas y detalle por campaña
- Aplicación a canjes
- Perfil, puntos, tienda y notificaciones

### Marcas

- Registro e inicio de sesión
- Dashboard con métricas
- Creación de campañas de canje y reto
- Vista y gestión de campañas
- Marketplace de creadores
- Gestión de recompensas y seguimiento de aplicaciones

## Notas operativas

- Si existe una sesión válida pero la app no puede reconstruir el perfil, revisá que el frontend apunte al proyecto correcto de Supabase y que la migración `202611010001_auth_profile_bootstrap.sql` esté aplicada.
- El esquema de referencia está documentado en `docs/schema.md`.

## Deploy

La aplicación está desplegada en Vercel en:

https://hackitba-collabspace.vercel.app/
