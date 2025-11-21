# TalkHub - Video Conferencing Frontend

Aplicación web de videoconferencias construida con React, TypeScript, Vite, Tailwind CSS y Firebase.

## 🚀 Tecnologías

- **React 19** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS v4** - Framework CSS
- **Firebase** - Autenticación
- **Zustand** - Gestión de estado
- **React Router** - Enrutamiento

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase
- Backend API corriendo (ver repositorio del backend)

## ⚙️ Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd MP3-FRONTEND
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Luego edita `.env` con tus credenciales de Firebase:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id

# Backend API URL
VITE_BACKEND_URL=http://localhost:3000
```

**⚠️ IMPORTANTE**: Nunca subas el archivo `.env` al repositorio. Ya está incluido en `.gitignore`.

### 4. Obtener credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "Project Settings" (⚙️)
4. En la sección "Your apps", selecciona o crea una app web
5. Copia las credenciales de configuración al archivo `.env`

### 5. Configurar autenticación en Firebase

1. En Firebase Console, ve a "Authentication"
2. Habilita los métodos de autenticación:
   - Email/Password
   - Google
   - GitHub (opcional)

## 🏃‍♂️ Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`

## 📦 Despliegue en Vercel

El proyecto incluye configuración para Vercel (`vercel.json`):

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

O conecta el repositorio directamente en [vercel.com](https://vercel.com)

**Recuerda configurar las variables de entorno en Vercel:**
- Settings → Environment Variables
- Agrega todas las variables del archivo `.env`

## 📁 Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
├── pages/           # Páginas/vistas
├── stores/          # Zustand stores (estado global)
├── services/        # Servicios (auth, API)
├── lib/             # Configuraciones (Firebase)
├── fetch/           # Cliente HTTP
├── types/           # Tipos TypeScript
└── assets/          # Imágenes, íconos, etc.
```

## 🔐 Rutas Protegidas

Las siguientes rutas requieren autenticación:
- `/dashboard` - Panel principal
- `/profile` - Perfil de usuario
- `/call/:roomId` - Sala de videollamada

## 🛠️ Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter (ESLint)

## 📄 Licencia

Este proyecto es parte de un proyecto universitario.

---

Desarrollado con ❤️ por el equipo MP3-NJJJPF

