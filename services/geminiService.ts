
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export type AiMode = 'normal' | 'think';

const cleanMermaidCode = (text: string): string => {
  // Remove markdown code blocks and common prefix/suffixes
  let cleaned = text
    .replace(/```mermaid\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Remove trailing conversational text if it exists
  // This looks for common Vietnamese/English phrases that AI might append
  const trailingPhrases = [
    /Dùng style và mermaid này.*/i,
    /Dùng code này.*/i,
    /Dùng Mermaid.*/i,
    /Hy vọng.*/i,
    /Here is the updated code.*/i,
    /I have fixed the syntax.*/i,
    /Hope this helps.*/i
  ];

  trailingPhrases.forEach(phrase => {
    cleaned = cleaned.replace(phrase, '').trim();
  });

  // Final safety check: if the last line looks like a sentence (starts with capital, ends with period/exclamation)
  // and is NOT a mermaid command, we might want to trim it, but that's risky.
  // Instead, let's just ensure we remove anything after the last '}' or ']' or ';' if it looks like prose.

  return cleaned;
};

export const generateDiagramFromText = async (prompt: string, currentCode: string, mode: AiMode = 'normal', theme: string = 'default'): Promise<string> => {
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const themeContext = theme === 'layered' ? 'The user is using a "Layered Architecture" theme. ALWAYS use "flowchart LR" for the root diagram. Use subgraphs for layers and set "direction LR" inside the main subgraph but "direction TB" inside individual layer subgraphs to create a professional grid-like flow.' : 
                       theme === 'gantt' ? 'The user is using a "Gantt Style" theme. Prefer generating Gantt charts if appropriate.' : 
                       theme === 'cloud' ? 'The user is using a "Cloud Arch" theme. ALWAYS use "flowchart LR" for the root diagram. Use subgraphs for regions/zones and set "direction LR" for the main flow.' : 
                       theme === 'database' ? 'The user is using a "Database Schema" theme. Prefer using erDiagram syntax.' : '';

  const systemInstruction = `
    You are an expert Mermaid.js architect. 
    Your goal is to provide valid, high-quality, and visually beautiful Mermaid.js code.
    
    ${themeContext}
    
    CRITICAL LAYOUT RULES:
    1. ALWAYS use "flowchart" instead of "graph" for better layout control.
    2. Use "flowchart LR" for architecture diagrams to ensure a clear Left-to-Right flow.
    3. Use subgraphs extensively to group related components and set "direction" inside them.
    4. ALIGNMENT & SIZE: To ensure nodes are aligned and have a consistent look:
       - Use "classDef standard fill:#fff,stroke:#333,stroke-width:1.5px;" to define a standard node style.
       - Apply this class to all main nodes: "class NodeA,NodeB standard;".
       - Use subgraphs as "columns" or "layers" to force alignment.
    5. Use descriptive node shapes for structure:
       - [rect] for general processes
       - (rounded) for start/end points
       - ([pill]) for external users or entry points
       - [[subroutine]] for specialized services or APIs
       - [(database)] for any data storage
       - {{decision}} for logic gates or routing
       - [/parallelogram/] for data input/output
    6. Use thick arrows (==>) for the primary data flow and dashed arrows (-.->) for control/metadata flow.
    
    CRITICAL SYNTAX RULES TO PREVENT "NODE_STRING" ERRORS:
    1. ONLY return the Mermaid code block. No explanation. No backticks.
    2. MANDATORY LINK ARROWS: A label |"text"| MUST ALWAYS be preceded by an arrow (--> or ==>).
       CORRECT: A -->|"Label"| B
       INCORRECT: A |"Label"| B (This is the primary cause of NODE_STRING errors)
    3. NO STRAY TEXT AFTER NODES: Never place random text, identifiers, or "ghost" strings after a node definition.
       BAD: C{"Label"} azz
       BAD: D[Text] randomword
       GOOD: C{"Label"}
    4. NO SEMICOLONS: Never use semicolons (;) at the end of lines. Use newlines only.
    5. NO SINGLE PERCENT COMMENTS: Comments must start with DOUBLE percentage signs (%%).
       INCORRECT: % Comment
       CORRECT: %% Comment
    6. ONE STATEMENT PER LINE: Ensure every relationship is on its own line.
    7. QUOTE ALL LABELS: Always wrap text labels in DOUBLE QUOTES.
       Example: ID["Label text"] or -->|"Link text"|
    8. NO SPECIAL CHARS IN LABELS: If a label contains parentheses (), brackets [], or special characters, it MUST be inside double quotes.
       CORRECT: A["Text (with parens)"]
       INCORRECT: A[Text (with parens)]
    9. For flowcharts:
       - Use 'graph TD' or 'graph LR'.
       - Use arrows like '-->' or '==>'.
    9. For sequence diagrams:
       - Use 'sequenceDiagram'.
       - Use 'participant' or 'actor' to define entities.
    10. For class diagrams:
       - Use 'classDiagram'.
    11. For ER diagrams:
       - Use 'erDiagram'.
    12. For Gantt charts:
       - Use 'gantt'.
    13. For Mindmaps:
       - Use 'mindmap'.
    14. For Timelines:
       - Use 'timeline'.
  `;

  const fullPrompt = `
    CURRENT DIAGRAM CODE:
    ${currentCode}

    USER REQUEST:
    ${prompt}

    Please provide the updated or new Mermaid.js code. 
    REMARK: If adding links with labels, ensure the syntax is exactly: Node1 -->|"Label"| Node2
    Ensure every statement is on its own line. NEVER use semicolons. NEVER use single % comments.
  `;

  const model = mode === 'think' ? 'gemini-3.1-flash-preview' : 'gemini-3.1-flash-lite-preview';
  const config: any = {
    systemInstruction,
    temperature: mode === 'think' ? 0.7 : 0.2,
  };

  if (mode === 'think') {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config,
    });

    return cleanMermaidCode(response.text || '');
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to process your request. Please try again.");
  }
};

export const fixMermaidSyntax = async (brokenCode: string, errorMessage: string, mode: AiMode = 'normal'): Promise<string> => {
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const systemInstruction = `
    You are a specialized Mermaid.js syntax repair expert.
    You will be given broken Mermaid code and the specific error message from the parser.
    
    REQUIRED FIXES for "NODE_STRING" errors:
    1. MISSING ARROWS BEFORE LABELS: Find lines like "Node |Label| Node". Change them to "Node -->|\"Label\"| Node". Every pipe-label MUST have an arrow (-->) immediately BEFORE it.
    2. STRAY TEXT REMOVAL: Identify and remove any "ghost" text, random identifiers (like 'aaa', 'azz', 'random'), or stray characters that appear after a node definition (e.g., after "Node[Text]").
    3. BAN SEMICOLONS: Delete all semicolons (;) from the code.
    4. FIX COMMENTS: Change single '%' to double '%%'. Ensure comments are on their own lines.
    5. QUOTE LABELS: Ensure every label inside brackets or pipes is wrapped in double quotes.
    6. NEWLINES: Ensure each relationship or node definition is on a NEW LINE.
    
    Return ONLY the fixed Mermaid code. No backticks. No talk.
  `;

  const fullPrompt = `
    BROKEN CODE:
    ${brokenCode}

    ERROR MESSAGE:
    ${errorMessage}

    Fixed Mermaid code (fix missing arrows before labels, remove semicolons, fix comments):
  `;

  const model = mode === 'think' ? 'gemini-3.1-flash-preview' : 'gemini-3.1-flash-lite-preview';
  const config: any = {
    systemInstruction,
    temperature: 0.1,
  };

  if (mode === 'think') {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config,
    });

    return cleanMermaidCode(response.text || '');
  } catch (error) {
    console.error("AI Fix Error:", error);
    throw new Error("Failed to autofix syntax.");
  }
};
