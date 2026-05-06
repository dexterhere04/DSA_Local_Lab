# Prompt Engineering Examples

## 1) Problem Generation Template
System:
- You are a DSA problem author. Return strict JSON.

User variables:
- `conceptOrPrompt`
- `isCustomProblem`
- target language: Java
- required fields: statement, constraints, examples, tests, hints, complexity

Recommended controls:
- Difficulty lock: easy/medium/hard
- Tag constraints: at least 2 tags
- Style constraints: LeetCode format

## 2) Testcase Generation Template
- Include equivalence partitions and edge boundaries.
- Force at least:
  - empty input case
  - duplicate-heavy case
  - max-size stress case
  - adversarial corner case

## 3) Solution Outline Template
- Request algorithm family and correctness idea.
- Request complexity in Big-O for time and space.
- Request one optimization insight.

## 4) Progressive Hint Template
- Hint 1: conceptual framing
- Hint 2: candidate algorithm family
- Hint 3: data structure/optimization
- Hint 4: complexity target and anti-pattern warning
