# BMW M4 Coupé 2014 - Landing Page

Una landing page minimalista, responsiva y moderna para el emblemático BMW M4 Coupé 2014.

## Características ✨

### Diseño
- **Dark Mode por defecto** con tema claro opcional
- **Tipografía elegante** usando Inter (Google Fonts)
- **Botones agresivos** con bordes rectos y estilos modernos
- **Colores BMW M** (Azul y Rojo) para acentos
- **Responsive** en todos los dispositivos

### Secciones
- **Hero**: Título impactante, descripción y botones CTA
- **Especificaciones**: Grid con motor S55, potencia y torque
- **Línea de Tiempo**: Timeline interactiva con 5 generaciones (M3 E30 → M4 F82 2014)
  - Desplegables con más información
  - Imágenes de cada generación
- **Galería**: Carrusel interactivo con 6 imágenes de alta calidad
  - Botones prev/next
  - Indicadores de posición
  - Imágenes grande (600px height)
- **Quiz**: 10 preguntas sobre el BMW M4 con validación
- **Footer**: Email y GitHub del autor

### Interactividad
- **Selector de colores**: Simula cambios de pintura (Alpine, Negro, Rojo)
- **Botón Rugido Motor**: Genera sonido de motor usando Web Audio API
- **Carrusel de Galería**: Navegación fluida con botones e indicadores
- **Timeline Desplegable**: Haz clic para ver detalles e imágenes
- **Tema Flotante**: Botón para alternar Dark/Light mode con persistencia
- **Scroll suave**: Navegación elegante entre secciones
- **Efectos hover**: Botones y elementos interactivos

## Estructura de archivos

```
proyecto2/
├── index.html       # HTML semántico con estructura completa
├── style.css        # Estilos modernos con CSS Grid/Flexbox
├── app.js          # Lógica interactiva en JavaScript limpio
└── README.md       # Este archivo
```

## Requisitos técnicos

- HTML5 semántico
- CSS3 moderno (Flexbox, Grid, Variables CSS)
- JavaScript ES6+ (sin librerías externas)
- Imágenes de Unsplash (URLs directas)

## Cómo usar

### Opción 1: Abrir localmente
Simplemente abre `index.html` en tu navegador:
```bash
open index.html
```

### Opción 2: Servir con un servidor local (recomendado para desarrollo)
```bash
# Python 3
python3 -m http.server 8000

# Node.js con http-server
npx http-server

# macOS con Ruby
ruby -run -ehttpd . -p8000
```
Luego accede a `http://localhost:8000`

### Opción 3: GitHub Pages (Producción) 🚀
La landing page está desplegada en GitHub Pages:

**URL:** https://nacho-urdaf.github.io/sesion-2/

Los cambios se publican automáticamente cuando haces push a `main`.

## Variables CSS (Dark Mode)

```css
:root {
  --bg: #08080a;           /* Fondo oscuro */
  --card: #0f1113;         /* Color de tarjetas */
  --muted: #9aa0a6;        /* Texto secundario */
  --text: #e6e9ee;         /* Texto principal */
  --accent-blue: #0a5bd7;  /* BMW M Azul */
  --accent-red: #d71a2a;   /* BMW M Rojo */
}

/* Light mode */
body.light {
  --bg: #f6f7fb;
  --card: #ffffff;
  --muted: #4b5563;
  --text: #0b0b0b;
}
```

## Funcionalidades principales

### 1. Selector de colores
- Botones de color para simular opciones de pintura
- Aplica filtros CSS a la imagen del héroe
- Cambios: Alpine (azul), Negro (gris), Rojo (saturado)

### 2. Sonido del motor
- Web Audio API genera rumble sintetizado
- Botón toggle para reproducir/detener
- Rampa de volumen suave

### 3. Carrusel
```javascript
// Navegación con botones prev/next
// Indicadores de página clickeable
// Auto-resize de imágenes responsivo
```

### 4. Timeline interactivo
```javascript
// Haz clic en cualquier generación para expandir
// Muestra descripción detallada e imagen
// Animación suave de entrada
```

### 5. Quiz
```javascript
// 10 preguntas sobre el BMW M4
// Validación en tiempo real
// Muestra resultado con puntuación
```

## Compatibilidad

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile (iOS Safari, Chrome Mobile)

## Optimizaciones

- Lazy loading en imágenes
- CSS variables para fácil personalización
- Sem dependencias externas
- Web Audio API para sonidos (sin archivos)
- Responsive design móvil-first

## Personalización

Puedes editar fácilmente:

**Colores**: Modifica las variables en `:root` de `style.css`
**Contenido**: Edita textos en `index.html`
**Imágenes**: Reemplaza URLs de Unsplash por tus imágenes
**Quiz**: Agrega más preguntas en el array `questions` en `app.js`

## Autor

**Ignacio Macias**
- Email: nachoswal7@gmail.com
- GitHub: https://github.com/nacho-urdaf

## Licencia

Proyecto educativo. Libre para uso personal y modificación.

---

*Desarrollado como landing page minimalista y responsiva del BMW M4 Coupé 2014.*
