# Estilos compartidos

`src/styles.css` es la fuente de los estilos de toda la aplicación. Angular ya lo carga para la aplicación y las pruebas mediante `angular.json`; no hay que importarlo desde los componentes.

## Organización

1. **Tokens en `:root`:** colores, tipografías, radio de bordes y ancho de contenido. Cambiar un token actualiza todas las reglas que lo utilizan.
2. **Base:** reset, fondo y tipografía del documento.
3. **Estructura compartida:** las páginas de inicio ciudadano y administrador utilizan las mismas reglas.
4. **Componentes compartidos:** cabecera, pie e indicadores de estado.
5. **Páginas:** reglas particulares y adaptaciones responsive. Las reglas idénticas entre páginas se agrupan en un único bloque con varios selectores.

## Cómo trabajar en equipo

- Agregar y modificar las reglas visuales en `src/styles.css`, en la sección correspondiente. Los archivos `*.component.css` quedan solo como referencia y ya no contienen reglas: todas se migraron a `styles.css`.
- Usar los tokens existentes, por ejemplo `var(--primary-blue)`, `var(--font-heading)` y `var(--radius-sm)`. Si aparece un valor compartido nuevo, declararlo en `:root` con un nombre que describa su propósito.
- Mantener el ámbito del componente: `app-header .main-nav` o `app-perfil > :where(.perfil-container) .campo`. Evitar reglas globales para clases genéricas como `.container`, `.btn`, `.row` o `.campo`.
- En las páginas, limitar las reglas al contenedor de contenido. `:where()` permite delimitar ese contenedor sin aumentar la especificidad. Así los estilos del contenido no afectan la cabecera ni el pie.
- Para un nuevo componente compartido, agregar una sección con su selector `app-...`. Reutilizar reglas existentes agrupando selectores cuando el diseño y las declaraciones sean iguales.
- Mantener las excepciones explícitas y las media queries junto a las reglas que adaptan. Evitar `!important`.
- Usar clases en las plantillas; no agregar atributos `style`, objetos `ngStyle` ni bloques `styles` en TypeScript para reglas estáticas.

## Entrega y verificación

Al compartir `src/styles.css`, los compañeros deben usar las mismas clases y selectores de componente. Los tokens y el CSS solos no crean la estructura HTML.

Desde `gestionReportes`, ejecutar `npm run build` y revisar las pantallas en escritorio y móvil después de cambiar estilos. Comprobar especialmente cabecera, pie, formularios, tablas e indicadores de estado.

## Sistema de botones

Todos los botones de accion comparten los tokens `--btn-height` (40px), `--btn-font-size` (14px), `--btn-font-weight` (600), `--btn-padding-x` (18px) y `--btn-radius` (4px). La altura se fija con `min-height` y `display: inline-flex`, de modo que agregar o quitar el borde no cambia el tamano del boton. Al crear un boton nuevo, reutilizar esos tokens en lugar de escribir `padding` y `font-size` a mano.

Variantes: primario (azul lleno), `.btn-asignar` (verde, solo para la accion de asignacion) y `.boton--contorno`. Todos los botones comparten un unico estado deshabilitado (`button:disabled`: opacidad 0.55 y cursor `not-allowed`); no agregar reglas por pagina.

## Campos de formulario

Los `input`, `select` y `textarea` de contenido usan `--field-height` (40px), `--field-font-size` (14px) y `--field-padding-x` (12px), de modo que un campo junto a un boton quede a la misma altura. Los `textarea` conservan altura automatica con `min-height: 96px`. Para un campo nuevo, reutilizar esos tokens.

Los `input[type="file"]` son la excepcion: quedan fuera de esa regla y usan altura automatica con padding `6px 8px` y un `::file-selector-button` con los colores del sistema, para que "Seleccionar archivo" y "Sin archivos seleccionados" queden centrados verticalmente en los mismos 40px.

## Radios, mensajes y titulos

- Todas las tarjetas (`.tarjeta`, `.carta`, `.tareas-card`, `.perfil-card`, `.grafico-reclamos`, `app-faq details`, menus) usan `--radius-sm` (4px), igual que botones y campos.
- La regla roja superior de los titulos mide siempre 5px (`border-top: 5px solid var(--nyc-red)`), tanto en las paginas de contenido como en login, registro y recuperar contrasena.
- Los avisos usan las cajas compartidas `.mensaje-error` / `.mensaje-exito` (tokens `--error-*` y `--success-*`): fondo tenue, borde de 1px y radio `--radius-sm`. En modificar y perfil el aviso de exito se llama `.alerta-exito` y comparte los mismos tokens.

## Componentes nuevos del Home

El navbar, el FAQ y el carrusel usan reglas centralizadas con selectores `app-...` en `styles.css`, reutilizando los tokens globales. Las funciones del Home y las plantillas no dependen de la organizacion de estilos.

Las flechas del carrusel de tarjetas miden 36px y se apoyan sobre el margen interno de la carta (padding horizontal de 20px), de modo que nunca tapan el titulo ni el texto.
