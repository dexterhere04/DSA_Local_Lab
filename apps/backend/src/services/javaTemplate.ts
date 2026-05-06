export const buildDefaultJavaStarter = (functionSignature: string) => `import java.util.*;

public class Solution {
    ${functionSignature} {
        // TODO: implement
        return 0;
    }
}
`;

export const buildLocalTestRunner = (sampleInput: string, sampleExpectedOutput: string) => `public class LocalTestRunner {
  public static void main(String[] args) {
    String input = ${JSON.stringify(sampleInput)};
    String expected = ${JSON.stringify(sampleExpectedOutput)};

    Object actual = new Solution().solve(input);
    System.out.println("Input: " + input);
    System.out.println("Expected: " + expected);
    System.out.println("Actual: " + actual);
    System.out.println(String.valueOf(actual).equals(expected) ? "PASS" : "FAIL");
  }
}
`;

export const buildJudgeRunnerSource = (userCode: string, input: string) => {
  const escapedInput = input
    .replaceAll("\\", "\\\\")
    .replaceAll("\"", "\\\"")
    .replaceAll("\n", "\\n");

  return `
${userCode}

class Runner {
    public static void main(String[] args) throws Exception {
        String input = "${escapedInput}";
        // Convention: users parse input inside solve. Keep this minimal for Java-first MVP.
        System.out.print(new Solution().solve(input));
    }
}
`.trim();
};
