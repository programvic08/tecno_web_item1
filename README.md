# 🏛️ Gestión de Reportes Ciudadanos

Aplicación web para la **gestión de reclamos municipales**. Permite a los ciudadanos reportar problemas urbanos (basura, alumbrado, infraestructura, ruidos) y hacerles seguimiento, mientras que los agentes municipales los administran, priorizan y analizan mediante reportes estadísticos.

> ⚠️ **Estado actual:** el proyecto funciona con **datos simulados (mock)**. No hay backend: los reclamos viven en memoria y se reinician al recargar la página.

![Angular](https://img.shields.io/badge/Angular-15.2-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript&logoColor=white)
![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?logo=reactivex&logoColor=white)

---

## 📋 Tabla de contenidos

- [Funcionalidades](#-funcionalidades)
- [Tecnologías](#-tecnologías)
- [Requisitos previos](#-requisitos-previos)
- [Instalación y ejecución](#-instalación-y-ejecución)
- [Cuentas de prueba](#-cuentas-de-prueba)
- [Rutas de la aplicación](#-rutas-de-la-aplicación)
- [Arquitectura y estructura](#-arquitectura-y-estructura)
- [Autenticación y seguridad](#-autenticación-y-seguridad)
- [Modelo de datos](#-modelo-de-datos)
- [Scripts disponibles](#-scripts-disponibles)
- [Próximos pasos](#-próximos-pasos)
- [Autores](#-autores)

---

## ✨ Funcionalidades

### 👤 Ciudadano
- **Crear reclamo** mediante un formulario por pasos: categoría, subcategoría, descripción, si es recurrente, dirección, fecha/hora observada, sector, referencia y evidencia adjunta.
- **Historial** de reclamos con filtro por estado.
- **Seguimiento del estado** buscando por folio, con una línea de tiempo (timeline) del avance.

### 🛠️ Administrador / Agente municipal
- **Bandeja de reclamos** con filtros por estado, categoría, prioridad y ubicación, y opción de asignarse un reclamo.
- **Modificar reclamo:** cambiar estado, prioridad, agente asignado y agregar observaciones.
- **Reportes estadísticos:** total de reclamos, tiempo promedio de resolución, y distribución por estado y por categoría.

### 🔐 General
- Inicio de sesión con validación de formulario.
- Redirección automática según el rol.
- Sesión con **expiración automática** y aviso en el login.
- Perfil de usuario editable (nombre, teléfono, dirección).
- Menú de navegación dinámico según el rol.

---

## 🧰 Tecnologías

| Tecnología | Uso |
|---|---|
| [Angular 15](https://angular.io/) | Framework principal (arquitectura con `NgModule`) |
| TypeScript 4.9 | Lenguaje |
| RxJS 7.8 | Estado reactivo (`BehaviorSubject`) y flujos asíncronos |
| Angular Router | Navegación y protección de rutas con guards |
| Angular Forms | Formularios template-driven y reactive |

---

## ✅ Requisitos previos

- [Node.js](https://nodejs.org/) **16.14+ o 18.x** (compatible con Angular 15)
- npm (incluido con Node.js)
- Angular CLI (opcional, para usar el comando `ng` directamente):

```bash
npm install -g @angular/cli@15
```

---

## 🚀 Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd gestionReportes

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm start
```

Luego abre **http://localhost:4200/** en tu navegador. La app se recarga automáticamente al modificar el código.

---

## 🔑 Cuentas de prueba

Al no existir backend, hay dos cuentas de demostración (también disponibles como botones en la pantalla de login):

| Rol | Correo | Contraseña |
|---|---|---|
| Ciudadano | `ciudadano@gmail.com` | `123456` |
| Administrador | `admin@gmail.com` | `123456` |

---

## 🗺️ Rutas de la aplicación

| Ruta | Componente | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/userHome` | Inicio del ciudadano | Ciudadano |
| `/crear-reclamo` | Crear un reclamo | Ciudadano |
| `/historial` | Historial de reclamos | Ciudadano |
| `/estado-reclamo` | Seguimiento por folio (`?folio=REC-2026-101`) | Ciudadano |
| `/adminHome` | Inicio del administrador | Administrador |
| `/bandeja-reclamos` | Bandeja con filtros | Administrador |
| `/modificar-reclamo` | Editar un reclamo (`?folio=...`) | Administrador |
| `/reporteReclamo` | Reportes estadísticos | Administrador |
| `/perfil` | Perfil del usuario (editable) | Ciudadano y Administrador |

Cualquier ruta inexistente redirige a `/login`.

---

## 🏗️ Arquitectura y estructura

```
src/app/
├── core/
│   ├── guards/          # AuthGuard (sesión) y RoleGuard (rol requerido)
│   └── services/        # AuthService y ReclamoService
├── models/              # Interfaces y enums (Reclamo, Usuario, estados, roles...)
├── pages/               # Vistas de la aplicación
│   ├── login/
│   ├── userhome/            ├── adminhome/
│   ├── crear-reclamo/       ├── bandeja-reclamos/
│   ├── historial/           ├── modificar-reclamo/
│   ├── estado-reclamo/      ├── reporte-reclamos/
│   └── perfil/
├── shared/components/   # Header, Footer y StatusBadge reutilizables
├── app-routing.module.ts
└── app.module.ts
```

**Decisiones de diseño**

- **Servicios como única fuente de datos:** los componentes solo consumen `AuthService` y `ReclamoService`. Cuando exista un backend, solo habrá que cambiar estos servicios.
- **Estado reactivo:** la lista de reclamos y la sesión se exponen como `Observable` (`reclamos$`, `usuario$`, `rol$`), y las vistas se actualizan solas.
- **Rutas protegidas por rol:** las rutas hijas de cada rol usan `AuthGuard` + `RoleGuard`. Si un usuario entra a una ruta que no le corresponde, se le redirige a su propio inicio.
- **Enums tipados** para estados, prioridades y roles, evitando strings sueltos.

---

## 🔒 Autenticación y seguridad

- Al iniciar sesión se genera un **token JWT simulado** (header + payload + firma ficticia) guardado en `sessionStorage`, por lo que se borra al cerrar la pestaña.
- El payload incluye `sub`, `rol`, `iat` y `exp`.
- La sesión **expira automáticamente** (20 minutos por defecto, configurable en `duracionSesionSeg` dentro de `auth.service.ts`). Al vencer, se cierra la sesión y se muestra un aviso en el login.
- Un token manipulado o mal formado se detecta y se considera sesión inválida.
- El perfil editado se guarda en `localStorage` por rol y se conserva entre sesiones.

> ⚠️ Esta autenticación es **solo una simulación para desarrollo**. La firma del token no es real y las credenciales están en el código. No debe usarse en producción.

---

## 🗃️ Modelo de datos

**Estados del reclamo:** `Recibido` → `En revisión` → `En proceso` → `Resuelto` / `Rechazado` → `Cerrado`

**Prioridades:** `Baja`, `Media`, `Alta`, `Urgente`

**Roles:** `Ciudadano`, `Administrador`

**Categorías disponibles**

| Categoría | Subcategorías |
|---|---|
| Aseo y Ornato | Microbasural, Corte de césped, Escombros |
| Alumbrado Público | Luminaria apagada, Poste dañado, Foco parpadeando |
| Infraestructura Urbana | Bache / Evento, Vereda rota, Señalética caída |
| Seguridad y Ruidos | Ruido molesto, Vehículo abandonado, Inseguridad |

Los folios tienen el formato `REC-2026-XXX`.

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo en `localhost:4200` |
| `npm run build` | Compila para producción en `dist/gestion-reportes` |
| `npm run watch` | Compila en modo desarrollo y observa cambios |
| `npm test` | Ejecuta las pruebas unitarias con Karma |

---

## 🔭 Próximos pasos

- [ ] Conectar con un backend real (API REST) y una base de datos.
- [ ] Autenticación real con JWT firmado en servidor.
- [ ] Persistencia de reclamos y subida real de evidencias.
- [ ] Filtros funcionales en el reporte estadístico (fechas, categoría, estado).
- [ ] Pantalla de detalle completo del reclamo en la bandeja.
- [ ] Recuperación de contraseña.

---
