# Cavi x AutoCava Prototype

AI-powered car shopping assistant prototype for AutoCava (autocava.com.mx).

## Pages

| File | Description |
|------|-------------|
| `index.html` | AutoCava homepage with Cavi widget overlay |
| `cavi-standalone.html` | Cavi standalone fullscreen chat experience |

## Navigation Flow

```
index.html (Homepage + Widget)
  ├── Fullscreen button / CA bubble → cavi-standalone.html
  ├── Nav items (Inicio/Financiamiento/Autos/Filtrar/Más vendidos)
  │     → cavi-standalone.html?embed=<autocava-url>
  └── Widget specialty buttons
        → cavi-standalone.html?msg=<message>

cavi-standalone.html (Cavi Standalone)
  ├── "Widget integrado" button → index.html
  ├── Reads ?embed=<url> on load → auto-opens embedded page + half panel
  ├── Reads ?msg=<text> on load → auto-sends chat message
  └── Half panel brand icon → returns to chat main view
```

## Tech

- Pure HTML/CSS/JavaScript (no build step)
- CSS custom properties for brand colors
- iframe embedding with navigation cropping
- Responsive design with mobile breakpoints

## Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--cavi-purple` | `#534ab7` | Primary brand |
| `--cavi-yellow` | `#FFD500` | Accent / nav bar |
| `--cavi-teal` | `#0d9488` | Secondary accent |

## Preview

Open `index.html` in any browser. No server required — cross-page navigation works with `file://` protocol.
