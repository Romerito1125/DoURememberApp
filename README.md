# DoURememberApp - Frontend

**DoURememberApp** es una aplicación web moderna construida con **Next.js** diseñada para gestionar pacientes, fotos, sesiones de rehabilitación y reportes de seguimiento de salud.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Configuración](#configuración)
- [Pruebas](#pruebas)
- [Variables de Entorno](#variables-de-entorno)
- [Contribuciones](#contribuciones)

---

## ✨ Características

- 🔐 **Autenticación segura** con Supabase
- 👥 **Gestión de usuarios** (pacientes, doctores, cuidadores)
- 📸 **Galería de fotos** con edición y clasificación
- 📊 **Reportes de seguimiento** con análisis de baseline
- 📋 **Sesiones de rehabilitación** con respuestas y seguimiento
- 🔔 **Sistema de notificaciones**
- 💊 **Control de vitaminas y suplementos**
- 📅 **Calendario de citas**
- 🎨 **Interfaz moderna** con componentes personalizados
- ✅ **Tests unitarios** con Jest
- 🧪 **Tests E2E** con Cypress

---

## 📦 Requisitos Previos

Asegúrate de tener instalado:

- **Node.js** (v18.x o superior)
- **npm** o **yarn** como gestor de paquetes
- **Git** para control de versiones

Verifica las versiones instaladas:

```bash
node --version
npm --version
```

---

## 🚀 Instalación

1. **Clona el repositorio:**

```bash
git clone https://github.com/Romerito1125/DoURememberApp.git
cd DoURememberApp
```

2. **Instala las dependencias:**

```bash
npm install
```

O si usas yarn:

```bash
yarn install
```

3. **Configura las variables de entorno:**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🛠️ Scripts Disponibles

### Desarrollo

```bash
npm run dev
```

Inicia el servidor de desarrollo en `http://localhost:3005` con recarga en caliente.

### Construcción (Build)

```bash
npm run build
```

Compila la aplicación para producción. Utiliza **Turbopack** para optimización.

### Producción

```bash
npm run start
```

Inicia el servidor en modo producción después del build.

### Linting

```bash
npm run lint
```

Ejecuta ESLint para verificar la calidad del código.

### Tests Unitarios

```bash
npm test
```

Ejecuta todos los tests con Jest.

```bash
npm run test:watch
```

Ejecuta los tests en modo observador (watch).

```bash
npm run test:coverage
```

Genera un reporte de cobertura de tests.

### Tests E2E (Cypress)

```bash
npm run cypress:open
```

Abre la interfaz de Cypress para ejecutar tests interactivamente.

```bash
npm run cypress:run
```

Ejecuta todos los tests E2E en modo headless.

```bash
npm run test:e2e
```

Inicia el servidor de desarrollo y abre Cypress.

```bash
npm run test:e2e:ci
```

Ejecuta tests E2E en modo CI/CD.

---

## 📁 Estructura del Proyecto

```
DoURememberApp/
├── src/
│   ├── app/                      # Directorio de Next.js App Router
│   │   ├── layout.tsx            # Layout principal
│   │   ├── page.tsx              # Página de inicio
│   │   ├── globals.css           # Estilos globales
│   │   ├── authentication/       # Módulo de autenticación (login, signup)
│   │   ├── photos/               # Gestión de fotos
│   │   │   ├── gallery/          # Galería de fotos
│   │   │   ├── upload/           # Carga de fotos
│   │   │   ├── edit/             # Edición de fotos
│   │   │   └── patient/          # Fotos por paciente
│   │   ├── reports/              # Reportes y análisis
│   │   │   └── baseline/         # Reportes de baseline
│   │   ├── sessions/             # Sesiones de rehabilitación
│   │   │   ├── create/           # Crear nuevas sesiones
│   │   │   └── responses/        # Respuestas de sesiones
│   │   └── users/                # Perfiles de usuarios
│   │       ├── patient/          # Panel del paciente
│   │       ├── doctor/           # Panel del doctor
│   │       └── cuidador/         # Panel del cuidador
│   │
│   ├── components/               # Componentes reutilizables
│   │   ├── ui/                   # Componentes UI base (Shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ... (más componentes)
│   │   ├── dashboard-header.tsx
│   │   ├── patient-list.tsx
│   │   ├── patient-caregivers-modal.tsx
│   │   ├── assign-caregiver-modal.tsx
│   │   ├── patient-sessions-modal.tsx
│   │   ├── latest-appointments.tsx
│   │   └── ... (más componentes)
│   │
│   ├── services/                 # Servicios y APIs
│   │   ├── api.ts                # Configuración base de la API
│   │   ├── auth.service.ts       # Autenticación
│   │   ├── assignment.service.ts # Asignación de cuidadores
│   │   ├── reports.service.ts    # Reportes
│   │   ├── descriptions.service.ts
│   │   └── http.service.ts       # Llamadas HTTP
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   │
│   ├── lib/
│   │   └── utils.ts              # Funciones utilitarias
│   │
│   ├── utils/
│   │   ├── baselineReportGenerator.tsx
│   │   └── supabase/             # Configuración de Supabase
│   │
│   ├── config/
│   │   └── constants.ts          # Constantes de la aplicación
│   │
│   ├── __tests__/                # Tests unitarios
│   │   └── components/
│   │       ├── Header.test.tsx
│   │       ├── Loading.test.tsx
│   │       ├── PhotoForm.test.tsx
│   │       └── ... (más tests)
│   │
│   ├── cypress/                  # Tests E2E
│   │   ├── e2e/
│   │   │   └── navigation.cy.ts
│   │   └── support/
│   │
│   ├── middleware.ts             # Middleware de Next.js
│   └── setupTests.ts             # Configuración de Jest
│
├── public/                       # Archivos estáticos
│   └── images/
│
├── Configuration Files
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── jest.config.js
│   ├── jest.setup.js
│   ├── cypress.config.js
│   ├── eslint.config.mjs
│   └── postcss.config.mjs
│
└── README.md
```

---

## 🛠️ Tecnologías Utilizadas

### Framework
- **Next.js 15** - Framework React con SSR y SSG
- **React 19** - Librería UI

### Autenticación y Base de Datos
- **Supabase** - Backend y autenticación
- **@supabase/supabase-js** - Cliente de Supabase

### Estilos
- **Tailwind CSS** - Framework de CSS utilitario
- **PostCSS** - Herramienta de transformación CSS
- **Shadcn/ui** - Componentes reutilizables accesibles
- **Radix UI** - Primitivos de UI accesibles

### Testing
- **Jest** - Framework de tests unitarios
- **Cypress** - Framework de tests E2E
- **start-server-and-test** - Utilidad para tests

### Herramientas de Desarrollo
- **TypeScript** - Tipado estático
- **ESLint** - Linting de código
- **Turbopack** - Compilador rápido (utilizado en build)

### Utilidades
- **Lucide React** - Iconos
- **CMDk** - Comando paleta
- **Embla Carousel** - Carrusel de imágenes
- **Class Variance Authority** - Gestión de variantes CSS

---

## ⚙️ Configuración

### TypeScript

La configuración se encuentra en `tsconfig.json`. El proyecto usa rutas absolutas configuradas:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Tailwind CSS

Configurado en `tailwind.config.ts` con temas personalizados y extensiones de colores.

### Next.js

Configuración en `next.config.ts`:
- Optimización de imágenes
- Compresión automática
- SWR para caché

---

## 🧪 Pruebas

### Tests Unitarios (Jest)

Ubicación: `src/__tests__/`

Para ejecutar tests unitarios:

```bash
npm test
```

Ejemplos de tests:
- `Header.test.tsx` - Tests del componente Header
- `PhotoForm.test.tsx` - Tests del formulario de fotos
- `PatientGallery.test.tsx` - Tests de la galería

### Tests E2E (Cypress)

Ubicación: `src/cypress/e2e/`

Para ejecutar tests E2E:

```bash
npm run cypress:open   # Modo interactivo
npm run cypress:run    # Modo headless
```

Ejemplo: `navigation.cy.ts` - Tests de navegación

---

## 🔐 Variables de Entorno

Crea un archivo `.env.local` en la raíz con:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API (si aplica)
NEXT_PUBLIC_API_URL=http://localhost:3005

# Node Environment
NODE_ENV=development
```

**Nota:** Las variables prefijadas con `NEXT_PUBLIC_` son públicas y se incluyen en el navegador.

---

## 🔄 Flujo de Desarrollo

1. **Crear rama de desarrollo:**
   ```bash
   git checkout -b feature/mi-feature
   ```

2. **Realizar cambios y verificar:**
   ```bash
   npm run lint      # Verificar código
   npm test          # Ejecutar tests
   npm run dev       # Probar en desarrollo
   ```

3. **Commit y push:**
   ```bash
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin feature/mi-feature
   ```

4. **Crear Pull Request** en GitHub

---

## 📝 Módulos Principales

### Autenticación (`/authentication`)
Manejo de login y signup con Supabase Auth.

### Fotos (`/photos`)
- Upload de fotos
- Galería con filtrado
- Edición de metadatos
- Asociación con pacientes

### Sesiones (`/sessions`)
- Creación de sesiones de rehabilitación
- Recopilación de respuestas
- Seguimiento y análisis

### Reportes (`/reports`)
- Reportes de baseline
- Análisis de progreso
- Generación de PDF

### Usuarios (`/users`)
- Dashboard del paciente
- Panel del doctor
- Perfil del cuidador

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecta tu repositorio GitHub a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push a main

### Otros Hosting

```bash
npm run build
npm start
```

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia privada. Para más detalles, contacta al propietario.

---

## 📞 Soporte

Para reportar problemas o sugerencias, abre un issue en el repositorio de GitHub.

---

**Última actualización:** Noviembre 2025
