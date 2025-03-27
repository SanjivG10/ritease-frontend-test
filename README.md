# PDF Annotation Application

A modern, feature-rich PDF annotation application built with Next.js, React, and Tailwind CSS.

## Features

- 📄 PDF Document Upload

  - Drag-and-drop support
  - File selection dialog
  - Document preview

- ✍️ Annotation Tools

  - Text highlighting with customizable colors
  - Text underlining with customizable colors
  - Comments on specific document parts
  - Digital signatures

- 💾 Export Capabilities
  - Export annotated documents as PDF
  - Maintain original document quality
  - Preserve all annotations and signatures

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide Icons
- **PDF Handling**: react-pdf, @react-pdf/renderer
- **State Management**: React Hooks
- **Type Safety**: TypeScript

## Getting Started

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd ritease-frontend-test
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Start the development server:

   ```bash
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── components/     # Reusable UI components
├── lib/           # Utility functions and hooks
├── styles/        # Global styles and Tailwind config
└── page.tsx       # Main application page
```

## Development Notes

- The application uses a single-page design for smooth transitions
- All PDF operations are performed client-side for better performance
- The UI is fully responsive and works on all screen sizes
- Modern React patterns and hooks are used throughout the codebase

## Future Enhancements

- [ ] Collaborative annotation features
- [ ] Cloud storage integration
- [ ] OCR capabilities
- [ ] Advanced drawing tools
- [ ] Document version control
- [ ] Batch processing of documents

## License

MIT
