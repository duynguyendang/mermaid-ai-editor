# MermaidAI Pro Editor

A high-performance, AI-powered Mermaid.js diagram editor with real-time preview, intelligent suggestions, and seamless export capabilities.

## Features

- **Real-time Preview**: See your diagrams render instantly as you type
- **AI-Powered Generation**: Generate or modify diagrams using natural language prompts with Google Gemini AI
- **Auto-Fix Syntax**: Automatically detect and fix Mermaid syntax errors with AI assistance
- **Syntax Highlighting**: Custom tokenizer for beautiful Mermaid syntax highlighting
- **Multiple Export Formats**: Export diagrams as SVG, PNG, or Markdown
- **Pre-built Templates**: Quick-start with flowchart, sequence, Gantt, class, ER, and GCP data platform templates
- **Interactive Preview**: Zoom and pan your diagrams for better visibility
- **Resizable Panels**: Customize your workspace with adjustable split-pane layout
- **Local Storage**: Your code persists automatically between sessions
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 19.2.3** - UI framework
- **TypeScript** - Type-safe development
- **Vite 6.2.0** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Mermaid.js 10.9.1** - Diagram rendering library
- **Google Gemini AI** - AI-powered diagram generation and syntax fixing

## Project Structure

```
mermaid-ai-editor/
├── App.tsx                 # Main application component
├── index.html              # HTML entry point with CDN dependencies
├── index.tsx               # React entry point
├── types.ts                # TypeScript type definitions
├── constants.tsx           # Default diagram and templates
├── components/
│   ├── Editor.tsx          # Code editor with syntax highlighting
│   └── Preview.tsx         # Live diagram preview with zoom/pan
├── services/
│   └── geminiService.ts    # AI integration for generation & fixing
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mermaid-ai-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Gemini API key:
   - Create a `.env.local` file in the root directory
   - Add your API key: `GEMINI_API_KEY=your_api_key_here`
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### Creating Diagrams

1. **Manual Editing**: Type Mermaid syntax directly in the editor
2. **AI Generation**: Use the AI prompt input to describe your diagram in natural language
3. **Templates**: Click the "Templates" button to start with pre-built diagrams

### Supported Diagram Types

- Flowcharts (`graph TD`, `graph LR`)
- Sequence Diagrams (`sequenceDiagram`)
- Gantt Charts (`gantt`)
- Class Diagrams (`classDiagram`)
- ER Diagrams (`erDiagram`)
- State Diagrams (`stateDiagram`)
- Pie Charts (`pie`)
- Git Graphs (`gitGraph`)
- Journey Maps (`journey`)

### Exporting Diagrams

- **Export SVG**: Vector format for scalable graphics
- **Export PNG**: Raster image for presentations and documents
- **Export MD**: Markdown code block for documentation

### Keyboard Shortcuts

- **Ctrl/Cmd + Scroll**: Zoom in/out
- **Drag**: Pan the diagram preview

## AI Features

### Diagram Generation

Describe your diagram in natural language and let AI generate the Mermaid code:

```
"Create a flowchart showing a user authentication process with login, verify credentials, and success/failure paths"
```

### Auto-Fix Syntax

When syntax errors occur, click "Autofix with Gemini" to automatically correct common issues:
- Missing arrows before labels
- Incorrect comment syntax
- Semicolon usage
- Trailing text after node definitions

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |

## Build & Deploy

### Production Build

```bash
npm run build
```

The optimized files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
