export const problemGenerationPrompt = (input: {
  conceptOrPrompt: string;
  isCustomProblem: boolean;
}) => `
You are a DSA problem author. Return valid JSON only.
Create a polished LeetCode-style Java-first problem.

Input type: ${input.isCustomProblem ? "custom_problem_statement" : "concept_topic"}
Input value: ${input.conceptOrPrompt}

Return JSON with this shape:
{
  "title": string,
  "statement": string,
  "constraints": string[],
  "examples": [{"input": string, "output": string, "explanation": string}],
  "edgeCases": string[],
  "publicTests": [{"input": string, "expectedOutput": string, "explanation": string, "isHidden": false}],
  "hiddenTests": [{"input": string, "expectedOutput": string, "explanation": string, "isHidden": true}],
  "hints": ["Hint 1...", "Hint 2...", "Hint 3...", "Hint 4..."],
  "functionSignature": string,
  "starterCode": string,
  "expectedComplexity": string,
  "difficulty": "easy" | "medium" | "hard",
  "tags": string[],
  "solutionOutline": string
}

Rules:
- Keep statement concise but complete.
- Include hidden tests targeting edge and stress conditions.
- CRITICAL: functionSignature MUST be exactly: public Object solve(String input)
- CRITICAL: starterCode MUST include the full class with: public class Solution { public Object solve(String input) { ... } }
- Parse the input String inside solve(). Return results as a String.
- Hints must be progressive.
- Complexity should mention time and space.
`;

export const testcaseGenerationPrompt = (problemStatement: string) => `
Generate additional test cases for this problem. Output valid JSON only.
Problem:\n${problemStatement}

Return shape:
{
  "publicTests": [{"input": string, "expectedOutput": string, "explanation": string, "isHidden": false}],
  "hiddenTests": [{"input": string, "expectedOutput": string, "explanation": string, "isHidden": true}]
}

Focus on:
- empty input
- duplicates
- max constraints
- pathological corner cases
`;

export const hintGenerationPrompt = (problemStatement: string) => `
Generate 4 progressive hints for this problem. Return valid JSON only.
Problem:\n${problemStatement}

Return shape:
{
  "hints": ["Hint 1", "Hint 2", "Hint 3", "Hint 4"]
}
`;

export const solutionGenerationPrompt = (problemStatement: string) => `
Provide a concise optimized Java solution outline for this problem.
Return valid JSON only.

Problem:\n${problemStatement}

Return shape:
{
  "solutionOutline": string,
  "expectedComplexity": string
}
`;
