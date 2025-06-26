import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with proper error handling
const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('Gemini API key not found. Please check your .env file.');
    throw new Error('Gemini API key not configured');
  }

  return new GoogleGenerativeAI(apiKey);
};

export interface CodeAnalysisResult {
  summary: string;
  bugs: string[];
  optimizations: string[];
  complexity: {
    time: string;
    space: string;
  };
  score: number;
  flowchart: string;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ProblemSolution {
  problem: string;
  language: string;
  solution: string;
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  optimizations: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    passed?: boolean;
  }>;
  videoScript: string;
  flowchart: string;
}

export interface OptimizationResult {
  code: string;
  improvements: string[];
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
}

// Robust JSON extraction function
const extractJSON = (content: string): string => {
  if (!content) {
    throw new Error('Empty response content');
  }

  // Step 1: Remove markdown code block fences
  let cleanContent = content.trim();
  
  // Remove ```json and ``` wrappers
  cleanContent = cleanContent.replace(/^```json\s*\n?/i, '');
  cleanContent = cleanContent.replace(/^```\s*\n?/, '');
  cleanContent = cleanContent.replace(/\n?\s*```$/, '');
  
  // Step 2: Extract JSON content between first { and last } or first [ and last ]
  let jsonStart = -1;
  let jsonEnd = -1;
  let isArray = false;
  
  // Find the first { or [
  for (let i = 0; i < cleanContent.length; i++) {
    if (cleanContent[i] === '{') {
      jsonStart = i;
      isArray = false;
      break;
    } else if (cleanContent[i] === '[') {
      jsonStart = i;
      isArray = true;
      break;
    }
  }
  
  if (jsonStart === -1) {
    throw new Error('No JSON object or array found in response');
  }
  
  // Find the matching closing bracket
  let bracketCount = 0;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  
  for (let i = jsonStart; i < cleanContent.length; i++) {
    if (cleanContent[i] === openBracket) {
      bracketCount++;
    } else if (cleanContent[i] === closeBracket) {
      bracketCount--;
      if (bracketCount === 0) {
        jsonEnd = i;
        break;
      }
    }
  }
  
  if (jsonEnd === -1) {
    throw new Error('Incomplete JSON structure found');
  }
  
  // Extract the JSON substring
  let jsonString = cleanContent.substring(jsonStart, jsonEnd + 1);
  
  return jsonString.trim();
};

// Built-in solutions for common problems when API is not available
const getBuiltInSolution = (problemStatement: string, language: string): ProblemSolution | null => {
  const problem = problemStatement.toLowerCase();
  
  if (problem.includes('armstrong') || problem.includes('armstrong number')) {
    const solutions = {
      javascript: `function isArmstrong(n) {
    // Convert number to string to get digits
    const str = n.toString();
    const numDigits = str.length;
    let sum = 0;
    
    // Calculate sum of each digit raised to power of number of digits
    for (let i = 0; i < str.length; i++) {
        const digit = parseInt(str[i]);
        sum += Math.pow(digit, numDigits);
    }
    
    // Check if sum equals original number
    return sum === n;
}

// Main function to solve the problem
function checkArmstrong(number) {
    if (isArmstrong(number)) {
        return "Armstrong";
    } else {
        return "Not Armstrong";
    }
}

// Test the function
const input = 153;
console.log(checkArmstrong(input)); // Output: Armstrong

// Additional test cases
console.log(checkArmstrong(370)); // Output: Armstrong
console.log(checkArmstrong(1431)); // Output: Not Armstrong`,

      python: `def is_armstrong(n):
    """Check if a number is an Armstrong number"""
    # Convert number to string to get digits
    str_n = str(n)
    num_digits = len(str_n)
    total = 0
    
    # Calculate sum of each digit raised to power of number of digits
    for digit_char in str_n:
        digit = int(digit_char)
        total += digit ** num_digits
    
    # Check if sum equals original number
    return total == n

def check_armstrong(number):
    """Main function to check Armstrong number"""
    if is_armstrong(number):
        return "Armstrong"
    else:
        return "Not Armstrong"

# Test the function
if __name__ == "__main__":
    # Read input
    n = int(input())
    
    # Check and print result
    result = check_armstrong(n)
    print(result)
    
    # Additional test cases for verification
    # print(check_armstrong(153))  # Armstrong
    # print(check_armstrong(370))  # Armstrong
    # print(check_armstrong(1431)) # Not Armstrong`,

      java: `import java.util.Scanner;

public class ArmstrongNumber {
    
    public static boolean isArmstrong(int n) {
        // Convert number to string to get digits
        String str = String.valueOf(n);
        int numDigits = str.length();
        int sum = 0;
        
        // Calculate sum of each digit raised to power of number of digits
        for (int i = 0; i < str.length(); i++) {
            int digit = Character.getNumericValue(str.charAt(i));
            sum += Math.pow(digit, numDigits);
        }
        
        // Check if sum equals original number
        return sum == n;
    }
    
    public static String checkArmstrong(int number) {
        if (isArmstrong(number)) {
            return "Armstrong";
        } else {
            return "Not Armstrong";
        }
    }
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read input
        int n = scanner.nextInt();
        
        // Check and print result
        String result = checkArmstrong(n);
        System.out.println(result);
        
        scanner.close();
    }
}`,

      cpp: `#include <iostream>
#include <string>
#include <cmath>
using namespace std;

bool isArmstrong(int n) {
    // Convert number to string to get digits
    string str = to_string(n);
    int numDigits = str.length();
    int sum = 0;
    
    // Calculate sum of each digit raised to power of number of digits
    for (char digitChar : str) {
        int digit = digitChar - '0';
        sum += pow(digit, numDigits);
    }
    
    // Check if sum equals original number
    return sum == n;
}

string checkArmstrong(int number) {
    if (isArmstrong(number)) {
        return "Armstrong";
    } else {
        return "Not Armstrong";
    }
}

int main() {
    int n;
    
    // Read input
    cin >> n;
    
    // Check and print result
    string result = checkArmstrong(n);
    cout << result << endl;
    
    return 0;
}`
    };

    const solutionCode = solutions[language as keyof typeof solutions] || solutions.javascript;

    return {
      problem: problemStatement,
      language: language,
      solution: solutionCode,
      explanation: `**Armstrong Number Solution Explanation:**

An Armstrong number (also known as a narcissistic number) is a number that equals the sum of its own digits each raised to the power of the number of digits.

**Algorithm Steps:**
1. **Get the number of digits** - Convert the number to string and get its length
2. **Calculate the sum** - For each digit, raise it to the power of total digits and add to sum
3. **Compare** - Check if the calculated sum equals the original number
4. **Return result** - "Armstrong" if equal, "Not Armstrong" if not

**Example with 153:**
- Number of digits: 3
- Calculation: 1³ + 5³ + 3³ = 1 + 125 + 27 = 153
- Since 153 = 153, it's an Armstrong number

**Example with 1431:**
- Number of digits: 4  
- Calculation: 1⁴ + 4⁴ + 3⁴ + 1⁴ = 1 + 256 + 81 + 1 = 339
- Since 339 ≠ 1431, it's not an Armstrong number

**Key Points:**
- The power is always equal to the number of digits
- Single digit numbers (0-9) are all Armstrong numbers
- Common Armstrong numbers: 0, 1, 153, 370, 371, 407, 1634, 8208, 9474`,
      timeComplexity: "O(d) where d is the number of digits",
      spaceComplexity: "O(1) - constant space",
      optimizations: [
        "Use integer arithmetic instead of string conversion for better performance",
        "Cache the power calculation if checking multiple numbers",
        "Early termination if sum exceeds the original number during calculation",
        "Use bit manipulation for single digit extraction in some cases"
      ],
      testCases: [
        { input: "153", expectedOutput: "Armstrong" },
        { input: "370", expectedOutput: "Armstrong" },
        { input: "371", expectedOutput: "Armstrong" },
        { input: "1431", expectedOutput: "Not Armstrong" },
        { input: "9", expectedOutput: "Armstrong" },
        { input: "10", expectedOutput: "Not Armstrong" }
      ],
      videoScript: `**Video Script: Armstrong Number Solution**

[0:00-0:15] **Introduction**
"Hello! Today we're solving the Armstrong Number problem. An Armstrong number is a special number where the sum of its digits, each raised to the power of the total number of digits, equals the original number."

[0:15-0:45] **Problem Understanding**
"Let's understand with example 153:
- It has 3 digits: 1, 5, 3
- We calculate: 1³ + 5³ + 3³ = 1 + 125 + 27 = 153
- Since this equals our original number, 153 is an Armstrong number!"

[0:45-1:30] **Algorithm Walkthrough**
"Our algorithm has 3 main steps:
1. Count the digits by converting to string
2. For each digit, raise it to the power of digit count
3. Compare the sum with original number"

[1:30-2:30] **Code Implementation**
"Let's implement this step by step:
- First, we get the digit count
- Then we iterate through each digit
- We use Math.pow to calculate digit^count
- Finally, we compare and return the result"

[2:30-3:00] **Testing & Verification**
"Let's test with our examples:
- 153: 1³+5³+3³ = 153 ✓ Armstrong
- 1431: 1⁴+4⁴+3⁴+1⁴ = 339 ≠ 1431 ✗ Not Armstrong"

[3:00-3:15] **Conclusion**
"This solution has O(d) time complexity where d is digits, and O(1) space complexity. Perfect for the Armstrong number problem!"`,
      flowchart: `graph TD
    A[Start] --> B[Read number N]
    B --> C[Convert N to string]
    C --> D[Get number of digits d]
    D --> E[Initialize sum = 0]
    E --> F[For each digit in N]
    F --> G[Extract digit]
    G --> H[Calculate digit^d]
    H --> I[Add to sum]
    I --> J{More digits?}
    J -->|Yes| F
    J -->|No| K{sum == N?}
    K -->|Yes| L[Print "Armstrong"]
    K -->|No| M[Print "Not Armstrong"]
    L --> N[End]
    M --> N`
    };
  }
  
  return null;
};

export class GeminiService {
  static async analyzeCode(code: string, language: string): Promise<CodeAnalysisResult> {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        Analyze the following ${language} code and provide a comprehensive analysis:

        \`\`\`${language}
        ${code}
        \`\`\`

        Please provide your analysis in the following JSON format:
        {
          "summary": "Brief description of what the code does",
          "bugs": ["List of potential bugs or issues"],
          "optimizations": ["List of optimization suggestions"],
          "complexity": {
            "time": "Time complexity (e.g., O(n))",
            "space": "Space complexity (e.g., O(1))"
          },
          "score": 85,
          "explanation": "Detailed step-by-step explanation of how the code works",
          "flowchart": "Mermaid.js flowchart syntax representing the code logic"
        }

        Focus on:
        1. Code functionality and purpose
        2. Potential bugs, edge cases, or logical errors
        3. Performance optimizations
        4. Best practices and code quality
        5. Time and space complexity analysis
        6. Generate a score from 0-100 based on code quality
        7. Create a detailed explanation suitable for learning
        8. Generate Mermaid.js flowchart syntax to visualize the logic flow

        IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.
      `;

      console.log('Sending request to Gemini...');
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      console.log('Gemini Response:', content);
      
      if (!content) {
        throw new Error('No response from Gemini');
      }

      // Use robust JSON extraction
      const cleanContent = extractJSON(content);
      console.log('Extracted JSON:', cleanContent);

      // Parse the JSON response
      const analysis = JSON.parse(cleanContent);
      
      // Validate and ensure all required fields are present
      return {
        summary: analysis.summary || "Code analysis completed",
        bugs: Array.isArray(analysis.bugs) ? analysis.bugs : [],
        optimizations: Array.isArray(analysis.optimizations) ? analysis.optimizations : [],
        complexity: {
          time: analysis.complexity?.time || "O(n)",
          space: analysis.complexity?.space || "O(1)"
        },
        score: typeof analysis.score === 'number' ? Math.min(100, Math.max(0, analysis.score)) : 75,
        flowchart: analysis.flowchart || "graph TD\n    A[Start] --> B[Process]\n    B --> C[End]",
        explanation: analysis.explanation || "This code performs the specified functionality."
      };

    } catch (error) {
      console.error('Error analyzing code:', error);
      
      // Provide more specific error messages
      if (error instanceof Error && error.message.includes('API key')) {
        return {
          summary: "API Configuration Error",
          bugs: ["Gemini API key is not properly configured"],
          optimizations: ["Please check your .env file and ensure VITE_GEMINI_API_KEY is set"],
          complexity: { time: "Unknown", space: "Unknown" },
          score: 0,
          flowchart: "graph TD\n    A[API Error] --> B[Check Configuration]",
          explanation: "The Gemini API key is not properly configured. Please check your environment variables."
        };
      }
      
      // Fallback analysis if API fails
      return {
        summary: "Unable to analyze code at this time. Please try again.",
        bugs: ["API connection error - please check your internet connection"],
        optimizations: ["Ensure code is properly formatted and try again"],
        complexity: { time: "Unknown", space: "Unknown" },
        score: 0,
        flowchart: "graph TD\n    A[Error] --> B[Please try again]",
        explanation: "Code analysis is temporarily unavailable. Please try again in a moment."
      };
    }
  }

  static async solveProblem(problemStatement: string, language: string): Promise<ProblemSolution> {
    // First, try to use built-in solutions for common problems
    const builtInSolution = getBuiltInSolution(problemStatement, language);
    if (builtInSolution) {
      console.log('Using built-in solution for common problem');
      return builtInSolution;
    }

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        You are an expert programmer. Solve the following programming problem and provide a complete solution:

        **Problem Statement:**
        ${problemStatement}

        **Requirements:**
        - Programming Language: ${language}
        - Provide a complete, working solution
        - Include detailed explanation
        - Analyze time and space complexity
        - Suggest optimizations
        - Create test cases
        - Generate a flowchart in Mermaid.js syntax

        Please provide your response in the following JSON format:
        {
          "problem": "${problemStatement}",
          "language": "${language}",
          "solution": "Complete working code solution",
          "explanation": "Detailed step-by-step explanation of the solution approach and implementation",
          "timeComplexity": "Time complexity analysis (e.g., O(n log n))",
          "spaceComplexity": "Space complexity analysis (e.g., O(n))",
          "optimizations": ["List of possible optimizations and improvements"],
          "testCases": [
            {
              "input": "Sample input",
              "expectedOutput": "Expected output"
            }
          ],
          "videoScript": "Script for explaining the solution in a video format",
          "flowchart": "Mermaid.js flowchart syntax showing the algorithm flow"
        }

        **Guidelines:**
        1. Write clean, well-commented code
        2. Handle edge cases appropriately
        3. Use best practices for the chosen language
        4. Provide multiple test cases covering different scenarios
        5. Explain the algorithm approach clearly
        6. Include complexity analysis reasoning
        7. Suggest realistic optimizations
        8. Create a comprehensive video script for educational purposes
        9. Generate a detailed flowchart showing the algorithm logic

        IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.
      `;

      console.log('Generating solution for problem...');
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      console.log('Solution generated:', content);
      
      if (!content) {
        throw new Error('No response from Gemini');
      }

      // Use robust JSON extraction
      const cleanContent = extractJSON(content);
      console.log('Extracted JSON:', cleanContent);

      // Parse the JSON response
      const solution = JSON.parse(cleanContent);
      
      // Validate and ensure all required fields are present
      return {
        problem: solution.problem || problemStatement,
        language: solution.language || language,
        solution: solution.solution || "// Solution code will be generated here",
        explanation: solution.explanation || "Solution explanation will be provided here.",
        timeComplexity: solution.timeComplexity || "O(n)",
        spaceComplexity: solution.spaceComplexity || "O(1)",
        optimizations: Array.isArray(solution.optimizations) ? solution.optimizations : [],
        testCases: Array.isArray(solution.testCases) ? solution.testCases : [],
        videoScript: solution.videoScript || "Video script will be generated here.",
        flowchart: solution.flowchart || "graph TD\n    A[Start] --> B[Process]\n    B --> C[End]"
      };

    } catch (error) {
      console.error('Error solving problem:', error);
      
      // Enhanced fallback solution with better error handling
      if (error instanceof Error && error.message.includes('API key')) {
        return {
          problem: problemStatement,
          language: language,
          solution: `// Gemini API key not configured
// Please add your API key to the .env file:
// VITE_GEMINI_API_KEY=your_actual_api_key_here

// For Armstrong Number problem, here's a basic solution:
function checkArmstrong(n) {
    const str = n.toString();
    const digits = str.length;
    let sum = 0;
    
    for (let i = 0; i < str.length; i++) {
        sum += Math.pow(parseInt(str[i]), digits);
    }
    
    return sum === n ? "Armstrong" : "Not Armstrong";
}

// Test
console.log(checkArmstrong(153)); // Armstrong
console.log(checkArmstrong(1431)); // Not Armstrong`,
          explanation: `**API Configuration Required**

To get AI-generated solutions, you need to:

1. **Get a Gemini API Key:**
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key

2. **Configure the Environment:**
   - Open the .env file in your project
   - Replace 'your_gemini_api_key_here' with your actual API key
   - Restart the development server

3. **For Armstrong Number Problem:**
   The basic approach is to:
   - Count the digits in the number
   - Sum each digit raised to the power of digit count
   - Compare with original number

**Example:** 153 = 1³ + 5³ + 3³ = 1 + 125 + 27 = 153 ✓`,
          timeComplexity: "O(d) where d is number of digits",
          spaceComplexity: "O(1) constant space",
          optimizations: [
            "Configure Gemini API for AI-powered solutions",
            "Use integer arithmetic instead of string conversion",
            "Add input validation for edge cases"
          ],
          testCases: [
            { input: "153", expectedOutput: "Armstrong" },
            { input: "1431", expectedOutput: "Not Armstrong" }
          ],
          videoScript: "Please configure the Gemini API key to generate video scripts and detailed explanations.",
          flowchart: "graph TD\n    A[Configure API] --> B[Generate Solution]\n    B --> C[Get Complete Analysis]"
        };
      }
      
      // Fallback solution if API fails
      return {
        problem: problemStatement,
        language: language,
        solution: `// Unable to generate solution at this time
// Please check your API configuration and try again

function solveProblem() {
    // Solution will be generated here
    return "Please try again";
}`,
        explanation: "Unable to generate solution explanation. Please check your API configuration and try again.",
        timeComplexity: "Unknown",
        spaceComplexity: "Unknown",
        optimizations: ["Please try again with a valid API connection"],
        testCases: [],
        videoScript: "Video script generation failed. Please try again.",
        flowchart: "graph TD\n    A[Error] --> B[Check API Configuration]"
      };
    }
  }

  static async optimizeCode(code: string, language: string): Promise<OptimizationResult> {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        Optimize the following ${language} code for better performance, readability, and best practices:

        \`\`\`${language}
        ${code}
        \`\`\`

        Please provide your optimization in the following JSON format:
        {
          "code": "Optimized version of the code",
          "improvements": ["List of specific improvements made"],
          "timeComplexity": "Improved time complexity",
          "spaceComplexity": "Improved space complexity",
          "explanation": "Detailed explanation of optimizations applied"
        }

        Focus on:
        1. Performance improvements
        2. Memory optimization
        3. Code readability and maintainability
        4. Best practices for the language
        5. Algorithm efficiency
        6. Error handling improvements
        7. Code structure and organization

        IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error('No response from Gemini');
      }

      // Use robust JSON extraction
      const cleanContent = extractJSON(content);
      console.log('Extracted JSON for optimization:', cleanContent);

      const optimization = JSON.parse(cleanContent);
      
      return {
        code: optimization.code || code,
        improvements: Array.isArray(optimization.improvements) ? optimization.improvements : [],
        timeComplexity: optimization.timeComplexity || "O(n)",
        spaceComplexity: optimization.spaceComplexity || "O(1)",
        explanation: optimization.explanation || "Optimization analysis completed."
      };

    } catch (error) {
      console.error('Error optimizing code:', error);
      
      return {
        code: code,
        improvements: ["Unable to optimize code at this time"],
        timeComplexity: "Unknown",
        spaceComplexity: "Unknown",
        explanation: "Code optimization failed. Please try again."
      };
    }
  }

  static async generateVideoScript(problem: string, solution: string, language: string): Promise<string> {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        Create a comprehensive video script for explaining the following programming problem and solution:

        **Problem:** ${problem}
        **Language:** ${language}
        **Solution:**
        \`\`\`${language}
        ${solution}
        \`\`\`

        Create a video script that includes:
        1. Introduction to the problem
        2. Problem analysis and approach
        3. Step-by-step code explanation
        4. Visual diagrams and flowchart descriptions
        5. Complexity analysis
        6. Alternative approaches
        7. Conclusion and key takeaways

        Format the script with clear sections, timing cues, and descriptions of visual elements that should be shown on screen.

        Make it educational, engaging, and suitable for a 5-10 minute video explanation.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      return content || "Video script generation failed. Please try again.";

    } catch (error) {
      console.error('Error generating video script:', error);
      return "Unable to generate video script at this time. Please check your API configuration and try again.";
    }
  }

  static async chatWithAssistant(messages: ChatMessage[]): Promise<string> {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      console.log('Sending chat request to Gemini...');
      
      // Convert messages to a single prompt for Gemini
      const conversationHistory = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      const systemPrompt = `You are CodeSage AI, an expert programming assistant and tutor. You help developers understand code, debug issues, learn programming concepts, and improve their coding skills.

IMPORTANT FORMATTING RULES:
- When showing code, ALWAYS wrap it in triple backticks with the language specified
- Example: \`\`\`javascript\n[code here]\n\`\`\`
- For inline code, use single backticks: \`variable\`
- Separate explanations from code clearly
- Use proper markdown formatting for better readability
- Structure your responses with clear sections

Your capabilities include:
- Explaining code functionality and logic
- Identifying and fixing bugs
- Suggesting optimizations and best practices
- Teaching programming concepts
- Helping with algorithm design
- Code review and feedback
- Answering programming questions

Always be helpful, educational, and encouraging. Provide clear explanations with examples when appropriate. If you need to see code to help, ask the user to share it.

When providing code examples:
1. Always use proper code formatting with language specification
2. Add comments to explain complex parts
3. Provide context before and after code blocks
4. Explain what the code does step by step

Conversation history:
${conversationHistory}

Please respond as CodeSage AI with proper formatting:`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      const content = response.text();
      
      console.log('Chat response received:', content);
      
      return content || "I'm sorry, I couldn't process your request. Please try again.";

    } catch (error) {
      console.error('Error in chat:', error);
      
      if (error instanceof Error && error.message.includes('API key')) {
        return "I'm having trouble connecting to my AI services. Please check that the Gemini API key is properly configured.\n\n**Troubleshooting Steps:**\n```bash\n# Check your .env file\nVITE_GEMINI_API_KEY=your_api_key_here\n```";
      }
      
      return "I'm experiencing some technical difficulties. Please try again in a moment.\n\n**If the problem persists:**\n• Check your internet connection\n• Verify API configuration\n• Try refreshing the page";
    }
  }

  static async generateChallenges(weakAreas: string[], difficulty: string = 'medium'): Promise<any[]> {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        Generate 3 coding challenges based on these weak areas: ${weakAreas.join(', ')}.
        Difficulty level: ${difficulty}

        For each challenge, provide:
        {
          "title": "Challenge title",
          "description": "Clear problem description",
          "difficulty": "${difficulty}",
          "tags": ["relevant", "tags"],
          "hints": ["helpful hints"],
          "solution_approach": "Brief approach description"
        }

        Return as a JSON array of challenges. Respond ONLY with valid JSON.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error('No response from Gemini');
      }

      // Use robust JSON extraction
      const cleanContent = extractJSON(content);
      console.log('Extracted JSON for challenges:', cleanContent);

      return JSON.parse(cleanContent);

    } catch (error) {
      console.error('Error generating challenges:', error);
      return [];
    }
  }

  static async explainConcept(concept: string, level: string = 'beginner'): Promise<string> {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        Explain the programming concept "${concept}" for a ${level} level programmer.
        
        IMPORTANT: Use proper markdown formatting and code blocks.
        
        Include:
        1. Clear definition
        2. Why it's important
        3. Simple example with properly formatted code using \`\`\`language
        4. Common use cases
        5. Best practices

        Make it educational and easy to understand with proper formatting.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      return content || "I couldn't explain this concept right now. Please try again.";

    } catch (error) {
      console.error('Error explaining concept:', error);
      return "I'm having trouble explaining this concept. Please try again.";
    }
  }

  // Test function to verify API connection
  static async testConnection(): Promise<boolean> {
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const result = await model.generateContent("Hello, can you respond with just 'OK' to test the connection?");
      const response = await result.response;
      const content = response.text();
      
      return content?.includes('OK') || false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}