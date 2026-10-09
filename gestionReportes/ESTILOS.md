# Estilos compartidos

`src/styles.css` es la fuente de los estilos de toda la aplicación. Angular ya lo carga para la aplicación y las pruebas mediante `angular.json`; no hay que importarlo desde los componentes.

## Organización

1. **Tokens en `:root`:** colores, tipografías, radio de bordes y ancho de contenido. Cambiar un token actualiza todas las reglas que lo utilizan.
2. **Base:** reset, fondo y tipografía del documento.
3. **Estructura compartida:** las páginas de inicio ciudadano y administrador utilizan las mismas reglas.
4. **Componentes compartidos:** cabecera, pie e indicadores de estado.
5. **Páginas:** reglas particulares y adaptaciones responsive. Las reglas idénticas entre páginas se agrupan en un único bloque con varios selectores.

## Cómo trabajar en equipo

- Agregar y modificar las reglas visuales en `src/styles.css`, en la sección correspondiente. Los archivos `*.component.css` se conservan como referencias, sin reglas activas.
- Usar los tokens existentes, por ejemplo `var(--primary-blue)`, `var(--font-heading)` y `var(--radius-sm)`. Si aparece un valor compartido nuevo, declararlo en `:root` con un nombre que describa su propósito.
- Mantener el ámbito del componente: `app-header .main-nav` o `app-perfil > :where(.perfil-container) .campo`. Evitar reglas globales para clases genéricas como `.container`, `.btn`, `.row` o `.campo`.
- En las páginas, limitar las reglas al contenedor de contenido. `:where()` permite delimitar ese contenedor sin aumentar la especificidad. Así los estilos del contenido no afectan la cabecera ni el pie.
- Para un nuevo componente compartido, agregar una sección con su selector `app-...`. Reutilizar reglas existentes agrupando selectores cuando el diseño y las declaraciones sean iguales.
- Mantener las excepciones explícitas y las media queries junto a las reglas que adaptan. Evitar `!important`.
- Usar clases en las plantillas; no agregar atributos `style`, objetos `ngStyle` ni bloques `styles` en TypeScript para reglas estáticas.

## Entrega y verificación

Al compartir `src/styles.css`, los compañeros deben usar las mismas clases y selectores de componente. Los tokens y el CSS solos no crean la estructura HTML.

Desde `gestionReportes`, ejecutar `npm run build` y revisar las pantallas en escritorio y móvil después de cambiar estilos. Comprobar especialmente cabecera, pie, formularios, tablas e indicadores de estado.
