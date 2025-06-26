import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type CodeSubmission = Database['public']['Tables']['code_submissions']['Row']
type CodeAnalysis = Database['public']['Tables']['code_analyses']['Row']

export interface CodeSubmissionData {
  title?: string
  description?: string
  code_content: string
  language: string
  submission_type?: 'analysis' | 'problem_solving' | 'challenge'
  problem_statement?: string
}

export interface AnalysisResultData {
  submission_id: string
  summary: string
  explanation: string
  score: number
  time_complexity: string
  space_complexity: string
  bugs: string[]
  optimizations: string[]
  processing_time_ms?: number
}

export interface ProblemSolutionData {
  problem_title: string
  problem_statement: string
  language: string
  solution_code: string
  explanation: string
  time_complexity: string
  space_complexity: string
  test_cases?: any[]
  optimizations?: string[]
}

export class DatabaseService {
  /**
   * Create a new code submission
   */
  static async createCodeSubmission(data: CodeSubmissionData): Promise<string> {
    try {
      const { data: submissionId, error } = await supabase.rpc('create_code_submission', {
        p_title: data.title || 'Untitled Submission',
        p_description: data.description || '',
        p_code_content: data.code_content,
        p_language: data.language,
        p_submission_type: data.submission_type || 'analysis',
        p_problem_statement: data.problem_statement || null
      })

      if (error) {
        throw error
      }

      return submissionId
    } catch (error) {
      console.error('Error creating code submission:', error)
      throw error
    }
  }

  /**
   * Save analysis result
   */
  static async saveAnalysisResult(data: AnalysisResultData): Promise<string> {
    try {
      const { data: analysisId, error } = await supabase.rpc('save_analysis_result', {
        p_submission_id: data.submission_id,
        p_summary: data.summary,
        p_explanation: data.explanation,
        p_score: data.score,
        p_time_complexity: data.time_complexity,
        p_space_complexity: data.space_complexity,
        p_bugs: data.bugs,
        p_optimizations: data.optimizations,
        p_processing_time_ms: data.processing_time_ms
      })

      if (error) {
        throw error
      }

      return analysisId
    } catch (error) {
      console.error('Error saving analysis result:', error)
      throw error
    }
  }

  /**
   * Save problem solution
   */
  static async saveProblemSolution(data: ProblemSolutionData): Promise<string> {
    try {
      const { data: solutionId, error } = await supabase.rpc('save_problem_solution', {
        p_problem_title: data.problem_title,
        p_problem_statement: data.problem_statement,
        p_language: data.language,
        p_solution_code: data.solution_code,
        p_explanation: data.explanation,
        p_time_complexity: data.time_complexity,
        p_space_complexity: data.space_complexity,
        p_test_cases: data.test_cases || [],
        p_optimizations: data.optimizations || []
      })

      if (error) {
        throw error
      }

      return solutionId
    } catch (error) {
      console.error('Error saving problem solution:', error)
      throw error
    }
  }

  /**
   * Get user's code submissions
   */
  static async getUserSubmissions(limit: number = 20, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('code_submissions')
        .select(`
          *,
          code_analyses (
            id,
            score,
            summary,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user submissions:', error)
      return []
    }
  }

  /**
   * Get submission with analysis
   */
  static async getSubmissionWithAnalysis(submissionId: string) {
    try {
      const { data, error } = await supabase
        .from('code_submissions')
        .select(`
          *,
          code_analyses (*),
          flowcharts (*),
          code_execution_results (*)
        `)
        .eq('id', submissionId)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching submission with analysis:', error)
      return null
    }
  }

  /**
   * Get user's problem solutions
   */
  static async getUserSolutions(limit: number = 20, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('problem_solutions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user solutions:', error)
      return []
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          total_analyses,
          total_problems_solved,
          total_videos_generated,
          daily_code_analysis_count,
          daily_problem_solving_count,
          daily_video_generation_count
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return null
    }
  }

  /**
   * Get public submissions (for community features)
   */
  static async getPublicSubmissions(limit: number = 20, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('code_submissions')
        .select(`
          *,
          user_profiles!inner (
            full_name,
            username,
            avatar_url
          ),
          code_analyses (
            score,
            summary
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching public submissions:', error)
      return []
    }
  }

  /**
   * Search submissions
   */
  static async searchSubmissions(query: string, filters?: {
    language?: string
    category?: string
    difficulty?: string
  }) {
    try {
      let queryBuilder = supabase
        .from('code_submissions')
        .select(`
          *,
          code_analyses (
            score,
            summary
          )
        `)

      // Add text search
      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      }

      // Add filters
      if (filters?.language) {
        queryBuilder = queryBuilder.eq('language', filters.language)
      }
      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category)
      }
      if (filters?.difficulty) {
        queryBuilder = queryBuilder.eq('difficulty_level', filters.difficulty)
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error searching submissions:', error)
      return []
    }
  }

  /**
   * Update submission
   */
  static async updateSubmission(submissionId: string, updates: Partial<CodeSubmission>) {
    try {
      const { error } = await supabase
        .from('code_submissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error updating submission:', error)
      throw error
    }
  }

  /**
   * Delete submission
   */
  static async deleteSubmission(submissionId: string) {
    try {
      const { error } = await supabase
        .from('code_submissions')
        .delete()
        .eq('id', submissionId)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error deleting submission:', error)
      throw error
    }
  }

  /**
   * Get challenges
   */
  static async getChallenges(filters?: {
    difficulty?: string
    category?: string
    featured?: boolean
  }) {
    try {
      let queryBuilder = supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)

      if (filters?.difficulty) {
        queryBuilder = queryBuilder.eq('difficulty', filters.difficulty)
      }
      if (filters?.category) {
        queryBuilder = queryBuilder.eq('category', filters.category)
      }
      if (filters?.featured) {
        queryBuilder = queryBuilder.eq('is_featured', true)
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching challenges:', error)
      return []
    }
  }

  /**
   * Get user progress
   */
  static async getUserProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching user progress:', error)
      return null
    }
  }

  /**
   * Get user achievements
   */
  static async getUserAchievements() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user achievements:', error)
      return []
    }
  }
}