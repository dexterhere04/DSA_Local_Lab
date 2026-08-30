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
difficulty, tags[], solutionOutline, referenceSolution,
timeLimitMs, memoryLimitMb

functionSignature: "public Object solve(String input)"

starterCode MUST be multi-line with 4-space indentation, imports, and TODO comment:
import java.util.*;

public class Solution {
    public Object solve(String input) {
        // TODO: implement your solution
        return 0;
    }
}

referenceSolution is the FULL, CORRECT, OPTIMAL Java solution that passes every
test case. It MUST be a complete Java class named "Solution" with the same
"public Object solve(String input)" signature, using only Java 8 APIs
(no List.of, Map.of, var, or String methods newer than Java 8). Its solve()
parses the input String and returns a String, exactly like starterCode.

timeLimitMs and memoryLimitMb are the complexity constraints (integers) the
judge enforces. Derive them from expectedComplexity and difficulty:
- easy: timeLimitMs 2000, memoryLimitMb 256
- medium: timeLimitMs 2000, memoryLimitMb 256
- hard: timeLimitMs 3000, memoryLimitMb 512

hiddenTests MUST include at least one input AT THE MAXIMUM constraint size to
enforce time and space complexity (a suboptimal solution should Time/Memory
Limit Exceed on it).

Use \\n for newlines in JSON strings.

Rules:
- Parse input String in solve(). Return String.
- Hints progressive. Complexity: time + space.
- Return JSON only.`;

export const schemaValidationPrompt = (json: string) => `Validate this JSON against the problem schema.

JSON:
${json}

Required fields: title, statement, constraints, examples, edgeCases, publicTests, hiddenTests, hints, functionSignature, starterCode, expectedComplexity, difficulty, tags, solutionOutline, referenceSolution, timeLimitMs, memoryLimitMb

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
9. referenceSolution is a complete Java 8 "Solution" class that actually solves the problem
10. hiddenTests include a maximum-constraint stress case
11. timeLimitMs and memoryLimitMb are sensible integers

Return ONLY:
{"valid":true/false,"issues":[{"field":"","problem":"","minimal_fix":""}]}
`;

export const patchPrompt = (originalJson: string, issues: string) => `Fix the issues in this JSON problem specification.

Original JSON:
${originalJson}

Issues to fix:
${issues}

Return ONLY the corrected full JSON. No explanations.`;

export const verificationPatchPrompt = (originalJson: string, failures: string) => `The reference solution failed some test cases when executed.
Fix either the failing test cases (if their expectedOutput is wrong) or the
referenceSolution (if the code is wrong), so that referenceSolution passes
every publicTests and hiddenTests within timeLimitMs and memoryLimitMb.

Original JSON:
${originalJson}

Execution failures:
${failures}

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
