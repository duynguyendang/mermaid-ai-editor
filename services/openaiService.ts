interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

const cleanMermaidCode = (text: string): string => {
  // Remove markdown code blocks and common prefix/suffixes
  return text
    .replace(/```mermaid\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
};

const getOpenAIResponse = async (
  prompt: string,
  systemInstruction: string,
  config: OpenAIConfig,
  temperature: number = 0.2
): Promise<string> => {
  const { apiKey, baseUrl = 'https://api.openai.com/v1', model = 'gpt-4o-mini' } = config;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

export const generateDiagramFromText = async (
  prompt: string,
  currentCode: string,
  config: OpenAIConfig
): Promise<string> => {
  const systemInstruction = `
    You are an expert Mermaid.js architect. 
    Your goal is to provide valid, high-quality Mermaid.js code based on user requests.
    
    CRITICAL SYNTAX RULES TO AVOID "NODE_STRING" ERRORS:
    1. ONLY return the Mermaid code block. No explanation. No backticks.
    2. MANDATORY LINK ARROWS: A label |"text"| MUST ALWAYS be preceded by an arrow.
       CORRECT: A -->|"Label"| B
       INCORRECT: A |"Label"| B (This is the #1 cause of NODE_STRING errors)
    3. NO SEMICOLONS: Never use semicolons (;) at the end of lines. Use newlines only.
    4. NO SINGLE PERCENT COMMENTS: Comments must start with DOUBLE percentage signs (%%).
       INCORRECT: % Comment
       CORRECT: %% Comment
    5. NO TRAILING TEXT: Never place random text or identifiers after a node definition.
       BAD: C{"Label"} azz
       GOOD: C{"Label"}
    6. ONE STATEMENT PER LINE: Ensure every relationship is on its own line.
    7. QUOTE ALL LABELS: Always wrap text labels in DOUBLE QUOTES.
       Example: ID["Label text"] or -->|"Link text"|
    8. For flowcharts:
       - Use 'graph TD' or 'graph LR'.
       - Use arrows like '-->' or '==>'.
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

  try {
    const response = await getOpenAIResponse(fullPrompt, systemInstruction, config, 0.2);
    return cleanMermaidCode(response);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to process your request. Please try again.");
  }
};

export const fixMermaidSyntax = async (
  brokenCode: string,
  errorMessage: string,
  config: OpenAIConfig
): Promise<string> => {
  const systemInstruction = `
    You are a specialized Mermaid.js syntax repair expert.
    You will be given broken Mermaid code and the specific error message from the parser.
    
    REQUIRED FIXES for "NODE_STRING" errors:
    1. MISSING ARROWS: Find lines like "Node |Label| Node". Change them to "Node -->|\\"Label\\"| Node". Every pipe-label must have an arrow BEFORE it.
    2. STRAY TEXT: Remove any "ghost" text like 'aaa', 'azz', or identifiers that appear after a node definition.
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

  try {
    const response = await getOpenAIResponse(fullPrompt, systemInstruction, config, 0.1);
    return cleanMermaidCode(response);
  } catch (error) {
    console.error("AI Fix Error:", error);
    throw new Error("Failed to autofix syntax.");
  }
};
