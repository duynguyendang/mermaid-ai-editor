
import { GoogleGenAI } from "@google/genai";

const cleanMermaidCode = (text: string): string => {
  // Remove markdown code blocks and common prefix/suffixes
  return text
    .replace(/```mermaid\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
};

export const generateDiagramFromText = async (prompt: string, currentCode: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are an expert Mermaid.js architect. 
    Your goal is to provide valid, high-quality Mermaid.js code based on user requests.
    
    CRITICAL SYNTAX RULES TO AVOID "NODE_STRING" ERRORS:
    1. ONLY return the Mermaid code block. No explanation. No backticks.
    2. ONE STATEMENT PER LINE: Every node definition or relationship MUST be on its own line.
    3. NO TRAILING TEXT: Never place any text, identifiers, or random characters after a node definition.
       BAD: A["Label"] strayText
       GOOD: A["Label"]
    4. MANDATORY LINK ARROWS: A label |"text"| MUST ALWAYS be preceded by an arrow.
       CORRECT: A -->|"Label"| B
       INCORRECT: A |"Label"| B
    5. QUOTE ALL LABELS: Always wrap text labels in DOUBLE QUOTES.
       Example: ID["Label text"] or -->|"Link text"|
    6. BAN SEMICOLONS: Do not use semicolons (;) anywhere. Use newlines to separate statements.
    7. COMMENTS: Use DOUBLE percentage signs (%%). Place comments on their OWN LINE ONLY. 
       Do not put comments on the same line as code.
    8. NO SPECIAL CHARACTERS IN IDs: Use simple alphanumeric IDs. Put descriptive text in the ["Labels"].
  `;

  const fullPrompt = `
    CURRENT DIAGRAM CODE:
    ${currentCode}

    USER REQUEST:
    ${prompt}

    Please provide the updated or new Mermaid.js code. 
    REMARK: If adding links with labels, ensure the syntax is exactly: Node1 -->|"Label"| Node2
    Ensure every statement is on its own line. NEVER leave stray text after a node.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Lower temperature for more consistent syntax
      },
    });

    return cleanMermaidCode(response.text || '');
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to process your request. Please try again.");
  }
};

export const fixMermaidSyntax = async (brokenCode: string, errorMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are a specialized Mermaid.js syntax repair expert.
    You will be given broken Mermaid code and the specific error message from the parser.
    
    REQUIRED FIXES for "NODE_STRING" (got 'NODE_STRING', expecting 'LINK' etc):
    1. STRAY TEXT: Look for text that isn't a node ID or a link arrow between components. 
       Specifically, look for random words like 'aaa', 'azz', or identifiers that follow a node's closing bracket. REMOVE THEM.
       Example: Change 'F["Car"] aaa' to 'F["Car"]'.
    2. NO SEMICOLONS: Remove all semicolons (;).
    3. COMMENTS: Move all comments (%%) to their own separate lines. Remove single % comments.
    4. MISSING ARROWS: Change 'Node |Label| Node' to 'Node -->|"Label"| Node'.
    5. QUOTE LABELS: Ensure every label inside brackets or pipes is wrapped in double quotes.
    6. NEWLINES: Ensure each relationship or node definition is on its own line.
    
    Return ONLY the fixed Mermaid code. No backticks. No talk.
  `;

  const fullPrompt = `
    BROKEN CODE:
    ${brokenCode}

    ERROR MESSAGE:
    ${errorMessage}

    Fixed Mermaid code (remove stray text, move comments to new lines, remove semicolons):
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    return cleanMermaidCode(response.text || '');
  } catch (error) {
    console.error("AI Fix Error:", error);
    throw new Error("Failed to autofix syntax.");
  }
};
