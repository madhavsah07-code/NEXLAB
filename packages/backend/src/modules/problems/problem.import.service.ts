// packages/backend/src/modules/problems/problem.import.service.ts

import { Types } from 'mongoose';
import { Problem } from './problem.model.js';
import { IProblem } from './problem.model.js';

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: ImportError[];
  problems: any[];
}

export interface ImportError {
  index: number;
  title?: string;
  error: string;
  data?: any;
}

export interface ProblemImportData {
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples?: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints?: string[];
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];
  starterCode?: {
    javascript?: string;
    python?: string;
    java?: string;
  };
  solutionCode?: string;
  hints?: string[];
  tags?: string[];
  timeLimit?: number;
  memoryLimit?: number;
  isPublished?: boolean;
}

export class ProblemImportService {
  
  static validateProblem(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string' || data.title.length < 3) {
      errors.push('Title must be at least 3 characters');
    }
    if (!data.difficulty || !['easy', 'medium', 'hard'].includes(data.difficulty)) {
      errors.push('Difficulty must be "easy", "medium", or "hard"');
    }
    if (!data.description || typeof data.description !== 'string' || data.description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    if (!data.testCases || !Array.isArray(data.testCases) || data.testCases.length === 0) {
      errors.push('At least one test case is required');
    }

    if (data.testCases && Array.isArray(data.testCases)) {
      data.testCases.forEach((tc: any, index: number) => {
        if (!tc.input) {
          errors.push(`Test case ${index + 1}: Input is required`);
        }
        if (tc.expectedOutput === undefined || tc.expectedOutput === null) {
          errors.push(`Test case ${index + 1}: Expected output is required`);
        }
      });
    }

    if (data.examples && Array.isArray(data.examples)) {
      data.examples.forEach((ex: any, index: number) => {
        if (!ex.input) {
          errors.push(`Example ${index + 1}: Input is required`);
        }
        if (!ex.output) {
          errors.push(`Example ${index + 1}: Output is required`);
        }
      });
    }

    if (data.starterCode) {
      if (typeof data.starterCode !== 'object' || Array.isArray(data.starterCode)) {
        errors.push('starterCode must be an object with language keys');
      } else {
        const validLanguages = ['javascript', 'python', 'java'];
        for (const key of Object.keys(data.starterCode)) {
          if (!validLanguages.includes(key)) {
            errors.push(`Invalid language key "${key}" in starterCode. Allowed: javascript, python, java`);
          }
          if (typeof data.starterCode[key] !== 'string') {
            errors.push(`starterCode.${key} must be a string`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  static async getNextProblemNumber(): Promise<number> {
    const lastProblem = await Problem.findOne({})
      .sort({ problemNumber: -1 })
      .select('problemNumber');
    return lastProblem ? lastProblem.problemNumber + 1 : 1;
  }

  static async importProblem(
    data: ProblemImportData,
    createdBy: string
  ): Promise<{ success: boolean; problem?: any; error?: string }> {
    try {
      const validation = this.validateProblem(data);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      const existing = await Problem.findOne({ 
        title: { $regex: new RegExp(`^${data.title}$`, 'i') } 
      });
      if (existing) {
        return { success: false, error: `Problem with title "${data.title}" already exists` };
      }

      const nextNumber = await this.getNextProblemNumber();

      const starterCode = {
        javascript: data.starterCode?.javascript || '',
        python: data.starterCode?.python || '',
        java: data.starterCode?.java || '',
      };

      const problemData = {
        title: data.title,
        problemNumber: nextNumber,
        difficulty: data.difficulty,
        description: data.description,
        examples: data.examples || [],
        constraints: data.constraints || [],
        testCases: data.testCases.map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden || false,
        })),
        starterCode: starterCode,
        solutionCode: data.solutionCode || '',
        hints: data.hints || [],
        tags: data.tags || [],
        timeLimit: data.timeLimit || 2000,
        memoryLimit: data.memoryLimit || 256,
        isPublished: data.isPublished ?? false,
        createdBy: new Types.ObjectId(createdBy),
      };

      const problem = await Problem.create(problemData);
      return { success: true, problem };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async importProblems(
    problems: ProblemImportData[],
    createdBy: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      total: problems.length,
      imported: 0,
      failed: 0,
      errors: [],
      problems: [],
    };

    for (let i = 0; i < problems.length; i++) {
      const problemData = problems[i];
      const importResult = await this.importProblem(problemData, createdBy);
      
      if (importResult.success) {
        result.imported++;
        result.problems.push(importResult.problem);
      } else {
        result.failed++;
        result.errors.push({
          index: i,
          title: problemData.title || `Problem ${i + 1}`,
          error: importResult.error || 'Unknown error',
          data: problemData,
        });
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  static generateTemplate(): ProblemImportData {
    return {
      title: "Example Problem",
      difficulty: "easy",
      description: "Write a function that adds two numbers.",
      examples: [
        {
          input: "5, 10",
          output: "15",
          explanation: "5 + 10 = 15"
        }
      ],
      constraints: [
        "1 <= a, b <= 1000"
      ],
      testCases: [
        {
          input: "5, 10",
          expectedOutput: "15",
          isHidden: false
        },
        {
          input: "3, 7",
          expectedOutput: "10",
          isHidden: false
        },
        {
          input: "100, 200",
          expectedOutput: "300",
          isHidden: true
        }
      ],
      starterCode: {
        javascript: `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
var addTwoNumbers = function(a, b) {
    // Write your solution here
    return 0;
};`,
        python: `def add_two_numbers(a: int, b: int) -> int:
    # Write your solution here
    return 0`,
        java: `public class Main {
    public static int addTwoNumbers(int a, int b) {
        // Write your solution here
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(addTwoNumbers(5, 10));
    }
}`
      },
      solutionCode: `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
var addTwoNumbers = function(a, b) {
    return a + b;
};`,
      hints: [
        "Use the + operator",
        "Return the sum directly"
      ],
      tags: ["math", "addition"],
      timeLimit: 2000,
      memoryLimit: 256,
      isPublished: false
    };
  }

  static validateJSONStructure(jsonData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!jsonData) {
      errors.push('No data provided');
      return { valid: false, errors };
    }

    const problems = Array.isArray(jsonData) ? jsonData : [jsonData];

    if (problems.length === 0) {
      errors.push('No problems found in the data');
      return { valid: false, errors };
    }

    problems.forEach((problem: any, index: number) => {
      const validation = this.validateProblem(problem);
      if (!validation.valid) {
        errors.push(`Problem ${index + 1}: ${validation.errors.join('; ')}`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  static async importFromJSONString(
    jsonString: string,
    createdBy: string
  ): Promise<ImportResult> {
    try {
      const data = JSON.parse(jsonString);
      const problems = Array.isArray(data) ? data : [data];
      
      const validation = this.validateJSONStructure(data);
      if (!validation.valid) {
        return {
          success: false,
          total: problems.length,
          imported: 0,
          failed: problems.length,
          errors: validation.errors.map((err, index) => ({
            index,
            title: `Problem ${index + 1}`,
            error: err,
            data: problems[index] || null,
          })),
          problems: [],
        };
      }

      return await this.importProblems(problems, createdBy);
    } catch (error: any) {
      return {
        success: false,
        total: 0,
        imported: 0,
        failed: 1,
        errors: [{
          index: 0,
          title: 'JSON Parse Error',
          error: error.message || 'Invalid JSON format',
          data: null,
        }],
        problems: [],
      };
    }
  }

  static async exportProblems(problemIds?: string[]): Promise<any[]> {
    const query: any = {};
    if (problemIds && problemIds.length > 0) {
      query._id = { $in: problemIds };
    }

    const problems = await Problem.find(query)
      .select('-createdBy -isPublished -__v')
      .lean();

    return problems.map((p: any) => ({
      title: p.title,
      difficulty: p.difficulty,
      description: p.description,
      examples: p.examples || [],
      constraints: p.constraints || [],
      testCases: p.testCases || [],
      starterCode: {
        javascript: p.starterCode?.javascript || '',
        python: p.starterCode?.python || '',
        java: p.starterCode?.java || '',
      },
      solutionCode: p.solutionCode || '',
      hints: p.hints || [],
      tags: p.tags || [],
      timeLimit: p.timeLimit || 2000,
      memoryLimit: p.memoryLimit || 256,
    }));
  }
}