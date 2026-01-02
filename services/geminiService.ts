
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
    
    CRITICAL SYNTAX RULES:
    1. ONLY return the Mermaid code block. No explanation. No backticks.
    2. Comments must start with DOUBLE percentage signs (%%). NEVER use a single %.
    3. Labels with spaces or special characters (like "đầu ra khác") are safer when enclosed in quotes if they cause issues, but Mermaid flowchart labels like "|text|" are usually fine unless they contain restricted symbols.
    4. Ensure every node used in a relationship is defined or follows the standard syntax: ID[Label] or ID(Label).
    5. Statements can end with a newline or a semicolon, but be consistent.
    6. For flowcharts, the direction is usually 'graph TD' or 'graph LR'.
  `;

  const fullPrompt = `
    CURRENT DIAGRAM CODE:
    ${currentCode}

    USER REQUEST:
    ${prompt}

    Please provide the updated or new Mermaid.js code:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.4,
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
    
    COMMON FIXES YOU MUST APPLY:
    1. Replace single '%' comments with double '%%'. This is a very frequent error.
    2. Ensure labels in flowcharts following the '|label|' syntax do not contain characters that confuse the parser (e.g., semicolons or unquoted special chars).
    3. If a semicolon is causing a 'got NODE_STRING' error, it might be misplaced or redundant—remove it or ensure it properly terminates the statement before a newline or comment.
    4. Ensure node IDs do not contain spaces unless the node is declared with a label: ID["Label with spaces"].
    5. Return ONLY the fixed Mermaid code. No backticks. No talk.
  `;

  const fullPrompt = `
    BROKEN CODE:
    ${brokenCode}

    ERROR MESSAGE:
    ${errorMessage}

    Fixed Mermaid code:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.1, // Very low for deterministic fixing
      },
    });

    return cleanMermaidCode(response.text || '');
  } catch (error) {
    console.error("AI Fix Error:", error);
    throw new Error("Failed to autofix syntax.");
  }
};
