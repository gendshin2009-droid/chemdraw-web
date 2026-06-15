# ChemDraw Web

A web-based chemical structure editor built with React, TypeScript, and Ketcher. This is a Phase 1 MVP implementation of a ChemDraw-like application for drawing, importing, and exporting chemical structures.

## Features (Phase 1)

- **Chemical Structure Drawing**: Draw molecules, reactions, and complex structures using the Ketcher editor
- **Import Structures**: Load structures from MOL, RXN, and SDF files
- **Export Formats**: Export to multiple formats:
  - MOL files
  - SMILES strings
  - InChI notation
  - PNG images
  - SVG images
- **Molecular Properties**: View SMILES and InChI representations of drawn structures
- **Real-time Updates**: Properties update as you draw

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Ketcher 3.15** - Chemical structure editor engine
  - `ketcher-react` - React component
  - `ketcher-core` - Core editor logic
  - Indigo WASM - Structure processing and layout

### Chemistry
- **RDKit.js** - Molecular property calculations and SMILES/InChI conversion (Phase 2)

## Installation

### Prerequisites
- Node.js 16+ 
- pnpm (or npm/yarn)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/chemdraw-web.git
cd chemdraw-web

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173`

## Development

### Available Scripts

```bash
# Start development server with HMR
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check

# Linting
pnpm lint
```

## Project Structure

```
chemdraw-web/
├── src/
│   ├── App.tsx           # Main application component
│   ├── App.css           # Application styles
│   ├── index.css         # Global styles
│   ├── main.tsx          # React entry point
│   └── vite-env.d.ts     # Vite type definitions
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Usage

### Drawing Structures

1. Use the Ketcher editor canvas to draw chemical structures
2. Use the toolbar to add atoms, bonds, and functional groups
3. Draw reactions using the reaction arrow tool

### Importing Structures

1. Click "Import Structure" and select a MOL, RXN, or SDF file
2. Or paste a SMILES string in the "SMILES Input" field and press Enter

### Exporting Structures

1. Select the desired export format from the dropdown
2. Click "Export" to download the file

### Viewing Properties

Molecular properties (SMILES and InChI) are displayed in the sidebar and update automatically as you draw.

## Roadmap

### Phase 2: Property Calculations
- Integrate RDKit.js for molecular weight, logP, TPSA, and other descriptors
- Live property updates with debouncing
- Valency validation and highlighting

### Phase 3: Advanced Structures
- Reaction support with atom mapping
- Stereochemistry tools (wedges, hashes, E/Z notation)
- R-groups and S-groups
- Template library

### Phase 4: Search and 3D
- Substructure search with PostgreSQL backend
- Similarity search
- 3D molecular visualization with 3Dmol.js or Miew

### Phase 5: Collaboration
- Real-time collaborative editing with Yjs and WebSocket
- Comments and annotations
- Version history

## Configuration

### Ketcher Static Resources

The application uses Ketcher's static resources from a CDN. To use local resources instead:

1. Download Ketcher static files
2. Place them in `public/ketcher-static/`
3. Update the `staticResourcesUrl` in `App.tsx`:

```typescript
staticResourcesUrl="./ketcher-static"
```

## Performance Considerations

- Ketcher and Indigo WASM modules are large (~5-10MB combined)
- Consider lazy loading for production deployments
- Use debouncing for property calculations to avoid excessive re-renders

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

- Phase 1 focuses on basic structure editing and export
- Property calculations are limited to SMILES and InChI (Phase 2 will add more)
- No collaborative editing yet (Phase 5)
- No 3D visualization (Phase 4)
- No substructure search (Phase 4)

## Legal Notice

ChemDraw is a registered trademark of Revvity/PerkinElmer. This project uses Ketcher, which is distributed under the Apache 2.0 license and can be used in commercial products with proper attribution.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## References

- [Ketcher Documentation](https://lifescience.opensource.epam.com/ketcher/)
- [RDKit.js Documentation](https://www.rdkit.org/docs/GettingStartedInJavaScript.html)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## Acknowledgments

- [EPAM](https://www.epam.com/) for Ketcher
- [RDKit](https://www.rdkit.org/) for cheminformatics algorithms
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) communities
