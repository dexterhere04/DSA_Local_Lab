export const problemGenerationPrompt = (input: {
  conceptOrPrompt: string;
  isCustomProblem: boolean;
}) => `Input: ${input.conceptOrPrompt}
Type: ${input.isCustomProblem ? "custom" : "concept"}

Return JSON with these fields:
title, statement, constraints[], examples[{input,output,explanation}],
edgeCases[], publicTests[{input,expectedOutput,explanation,isHidden:false}],
hiddenTests[{input,expectedOutput,explanation,isHidden:true}],
hints[], functionSignature, starterCode, expectedComplexity,
difficulty, tags[], solutionOutline

functionSignature: "public Object solve(String input)"

starterCode MUST be multi-line with 4-space indentation, imports, and TODO comment:
import java.util.*;

public class Solution {
    public Object solve(String input) {
        // TODO: implement your solution
        return 0;
    }
}

Use \\n for newlines in JSON strings.

Rules:
- Parse input String in solve(). Return String.
- Hints progressive. Complexity: time + space.
Return JSON only.`;

export const schemaValidationPrompt = (json: string) => `Validate this JSON against the problem schema.

JSON:
${json}

Required fields: title, statement, constraints, examples, edgeCases, publicTests, hiddenTests, hints, functionSignature, starterCode, expectedComplexity, difficulty, tags, solutionOutline

Return ONLY:
{"valid":true/false,"issues":[{"field":"","problem":"","minimal_fix":""}]}
`;

export const llmValidationPrompt = (json: string) => `Review this DSA problem for quality.

Problem:
${json}

Check:
1. statement clear and complete
2. constraints match problem
3. examples valid for statement
4. test cases solvable and correct
5. hints progressive and non-redundant
6. difficulty matches complexity
7. functionSignature is "public Object solve(String input)"
8. starterCode has proper indentation (4 spaces), imports, and comments

Return ONLY:
{"valid":true/false,"issues":[{"field":"","problem":"","minimal_fix":""}]}
`;

export const patchPrompt = (originalJson: string, issues: string) => `Fix the issues in this JSON problem specification.

Original JSON:
${originalJson}

Issues to fix:
${issues}

Return ONLY the corrected full JSON. No explanations.`;

export const testcaseGenerationPrompt = (problemStatement: string) => `Generate additional test cases for this problem. Output valid JSON only.
Problem:\n${problemStatement}

Return shape:
{"publicTests":[{"input":"","expectedOutput":"","explanation":"","isHidden":false}],"hiddenTests":[{"input":"","expectedOutput":"","explanation":"","isHidden":true}]}

Focus on:
- empty input
- duplicates
- max constraints
- pathological corner cases
`;

export const hintGenerationPrompt = (problemStatement: string) => `Generate 4 progressive hints for this problem. Return valid JSON only.
Problem:\n${problemStatement}

Return shape:
{"hints":["Hint 1","Hint 2","Hint 3","Hint 4"]}
`;

export const solutionGenerationPrompt = (problemStatement: string) => `Provide a concise optimized Java solution outline for this problem.
Return valid JSON only.

Problem:\n${problemStatement}

Return shape:
{"solutionOutline":"","expectedComplexity":""}
`;
