import axios from 'axios';

// Tavus API configuration
const TAVUS_API_BASE = 'https://tavusapi.com';
const TAVUS_API_KEY = import.meta.env.VITE_TAVUS_API_KEY;

if (!TAVUS_API_KEY) {
  console.warn('Tavus API key not found. Video generation will be disabled.');
}

// Tavus API client
const tavusClient = axios.create({
  baseURL: TAVUS_API_BASE,
  headers: {
    'x-api-key': TAVUS_API_KEY,
    'Content-Type': 'application/json',
  },
});

export interface TavusVideoRequest {
  script: string;
  replica_id?: string;
  persona_id?: string;
  video_name?: string;
  background_url?: string;
  callback_url?: string;
  voice_settings?: {
    speed?: number;
    pitch?: number;
    volume?: number;
  };
  video_settings?: {
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    resolution?: '720p' | '1080p' | '4k';
    fps?: 24 | 30 | 60;
  };
}

export interface TavusVideoResponse {
  video_id: string;
  status: 'queued' | 'generating' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  video_name?: string;
  duration?: number;
  replica_id?: string;
  persona_id?: string;
  quality?: string;
  resolution?: string;
}

export interface TavusReplica {
  replica_id: string;
  name: string;
  status: 'ready' | 'training' | 'failed';
  created_at: string;
  thumbnail_url?: string;
  description?: string;
  voice_type?: string;
  gender?: 'male' | 'female' | 'neutral';
  accent?: string;
  is_premium?: boolean;
}

export interface TavusPersona {
  persona_id: string;
  name: string;
  description?: string;
  personality_traits?: string[];
  speaking_style?: string;
  expertise_areas?: string[];
  is_premium?: boolean;
}

export interface TavusBackground {
  id: string;
  name: string;
  url: string;
  category: 'office' | 'classroom' | 'tech' | 'nature' | 'abstract' | 'custom';
  is_premium?: boolean;
}

export interface BatchVideoRequest {
  videos: Array<{
    script: string;
    video_name: string;
    replica_id?: string;
    persona_id?: string;
  }>;
  shared_settings?: {
    background_url?: string;
    voice_settings?: TavusVideoRequest['voice_settings'];
    video_settings?: TavusVideoRequest['video_settings'];
  };
}

export class TavusService {
  /**
   * Test connection to Tavus API with enhanced error reporting
   */
  static async testConnection(): Promise<{ connected: boolean; error?: string; accountInfo?: any }> {
    try {
      if (!TAVUS_API_KEY) {
        return {
          connected: false,
          error: 'Tavus API key not configured. Please add VITE_TAVUS_API_KEY to your .env file.'
        };
      }

      const response = await tavusClient.get('/v2/replicas');
      
      // Get account information
      const accountResponse = await tavusClient.get('/v2/account').catch(() => null);
      
      return {
        connected: true,
        accountInfo: accountResponse?.data || null
      };
    } catch (error) {
      console.error('Tavus connection test failed:', error);
      
      if (axios.isAxiosError(error)) {
        switch (error.response?.status) {
          case 401:
            return {
              connected: false,
              error: 'Invalid API key. Please check your Tavus API key in the .env file.'
            };
          case 402:
            return {
              connected: false,
              error: 'Insufficient credits or expired subscription. Please check your Tavus account dashboard.'
            };
          case 403:
            return {
              connected: false,
              error: 'Access forbidden. Your API key may not have the required permissions.'
            };
          case 429:
            return {
              connected: false,
              error: 'Rate limit exceeded. Please try again later.'
            };
          default:
            return {
              connected: false,
              error: `API error: ${error.response?.status} - ${error.response?.statusText}`
            };
        }
      }
      
      return {
        connected: false,
        error: 'Network error. Please check your internet connection.'
      };
    }
  }

  /**
   * Get available replicas with enhanced filtering and sorting
   */
  static async getReplicas(filters?: {
    gender?: 'male' | 'female' | 'neutral';
    voice_type?: string;
    is_premium?: boolean;
  }): Promise<TavusReplica[]> {
    try {
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      const response = await tavusClient.get('/v2/replicas');
      let replicas: TavusReplica[] = response.data.data || [];

      // Apply filters
      if (filters) {
        replicas = replicas.filter(replica => {
          if (filters.gender && replica.gender !== filters.gender) return false;
          if (filters.voice_type && replica.voice_type !== filters.voice_type) return false;
          if (filters.is_premium !== undefined && replica.is_premium !== filters.is_premium) return false;
          return true;
        });
      }

      // Enhanced sorting with null safety
      replicas.sort((a, b) => {
        // First priority: status (ready first)
        if (a.status === 'ready' && b.status !== 'ready') return -1;
        if (a.status !== 'ready' && b.status === 'ready') return 1;
        
        // Second priority: premium status (non-premium first for better UX)
        if (!a.is_premium && b.is_premium) return -1;
        if (a.is_premium && !b.is_premium) return 1;
        
        // Third priority: name (with null safety)
        const nameA = a.name || '';
        const nameB = b.name || '';
        
        // Ensure both names are strings before comparison
        if (typeof nameA === 'string' && typeof nameB === 'string') {
          return nameA.localeCompare(nameB);
        }
        
        // Fallback: sort by replica_id if names are not available
        return (a.replica_id || '').localeCompare(b.replica_id || '');
      });

      return replicas;
    } catch (error) {
      console.error('Error fetching replicas:', error);
      this.handleApiError(error);
      return [];
    }
  }

  /**
   * Get available personas for enhanced AI personality
   */
  static async getPersonas(): Promise<TavusPersona[]> {
    try {
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      const response = await tavusClient.get('/v2/personas');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching personas:', error);
      this.handleApiError(error);
      return [];
    }
  }

  /**
   * Get available backgrounds
   */
  static async getBackgrounds(): Promise<TavusBackground[]> {
    // Since Tavus API might not have a backgrounds endpoint, we'll provide predefined ones
    const backgrounds: TavusBackground[] = [
      {
        id: 'office-modern',
        name: 'Modern Office',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop',
        category: 'office'
      },
      {
        id: 'classroom-tech',
        name: 'Tech Classroom',
        url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1920&h=1080&fit=crop',
        category: 'classroom'
      },
      {
        id: 'coding-setup',
        name: 'Coding Setup',
        url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1920&h=1080&fit=crop',
        category: 'tech'
      },
      {
        id: 'minimalist-white',
        name: 'Minimalist White',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&h=1080&fit=crop',
        category: 'abstract'
      },
      {
        id: 'gradient-blue',
        name: 'Blue Gradient',
        url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=1080&fit=crop',
        category: 'abstract'
      },
      {
        id: 'nature-calm',
        name: 'Calm Nature',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
        category: 'nature',
        is_premium: true
      }
    ];

    return backgrounds;
  }

  /**
   * Enhanced video generation with advanced options
   */
  static async generateVideo(request: TavusVideoRequest): Promise<TavusVideoResponse> {
    try {
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      // Enhanced video request with default settings
      const enhancedRequest = {
        script: request.script,
        replica_id: request.replica_id || 'r7e6c4b8a9d2f1e3c5b7a9d2f1e3c5b7',
        persona_id: request.persona_id,
        video_name: request.video_name || `CodeSage Explanation - ${new Date().toISOString()}`,
        background_url: request.background_url,
        callback_url: request.callback_url,
        voice_settings: {
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0,
          ...request.voice_settings
        },
        video_settings: {
          quality: 'high',
          resolution: '1080p',
          fps: 30,
          ...request.video_settings
        }
      };

      console.log('Generating enhanced video with Tavus:', enhancedRequest);

      const response = await tavusClient.post('/v2/videos', enhancedRequest);
      
      if (response.status !== 201 && response.status !== 200) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error generating video:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Batch video generation for multiple explanations
   */
  static async generateBatchVideos(request: BatchVideoRequest): Promise<TavusVideoResponse[]> {
    try {
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      const results: TavusVideoResponse[] = [];
      
      // Generate videos sequentially to avoid rate limits
      for (const videoRequest of request.videos) {
        const fullRequest: TavusVideoRequest = {
          ...videoRequest,
          background_url: request.shared_settings?.background_url,
          voice_settings: request.shared_settings?.voice_settings,
          video_settings: request.shared_settings?.video_settings
        };

        const result = await this.generateVideo(fullRequest);
        results.push(result);
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return results;
    } catch (error) {
      console.error('Error generating batch videos:', error);
      throw error;
    }
  }

  /**
   * Get video status with enhanced details
   */
  static async getVideo(videoId: string): Promise<TavusVideoResponse> {
    try {
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      const response = await tavusClient.get(`/v2/videos/${videoId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching video:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Delete a video with confirmation
   */
  static async deleteVideo(videoId: string): Promise<boolean> {
    try {
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      const response = await tavusClient.delete(`/v2/videos/${videoId}`);
      return response.status === 204;
    } catch (error) {
      console.error('Error deleting video:', error);
      this.handleApiError(error);
      return false;
    }
  }

  /**
   * Get user's video history with pagination
   */
  static async getVideoHistory(page: number = 1, limit: number = 10): Promise<{
    videos: TavusVideoResponse[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      const response = await tavusClient.get(`/v2/videos?page=${page}&limit=${limit}`);
      const videos = response.data.data || [];
      const total = response.data.total || 0;
      
      return {
        videos,
        total,
        hasMore: videos.length === limit
      };
    } catch (error) {
      console.error('Error fetching video history:', error);
      this.handleApiError(error);
      return { videos: [], total: 0, hasMore: false };
    }
  }

  /**
   * Enhanced script formatting for optimal video generation
   */
  static formatScriptForVideo(
    script: string, 
    problemTitle: string, 
    options?: {
      includeIntro?: boolean;
      includeConclusion?: boolean;
      speakingStyle?: 'casual' | 'professional' | 'educational' | 'enthusiastic';
      pace?: 'slow' | 'normal' | 'fast';
    }
  ): string {
    const { 
      includeIntro = true, 
      includeConclusion = true, 
      speakingStyle = 'educational',
      pace = 'normal'
    } = options || {};

    // Clean and format the script
    let cleanScript = script
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code formatting
      .replace(/```[\s\S]*?```/g, '[Code Example]') // Replace code blocks
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();

    // Add speaking style modifications
    switch (speakingStyle) {
      case 'casual':
        cleanScript = cleanScript.replace(/\./g, '... ');
        break;
      case 'enthusiastic':
        cleanScript = cleanScript.replace(/!/g, '!! ');
        break;
      case 'professional':
        cleanScript = cleanScript.replace(/\s+/g, ' ');
        break;
    }

    // Add pace modifications
    switch (pace) {
      case 'slow':
        cleanScript = cleanScript.replace(/\./g, '... ');
        cleanScript = cleanScript.replace(/,/g, ', ... ');
        break;
      case 'fast':
        cleanScript = cleanScript.replace(/\s+/g, ' ');
        break;
    }

    // Build the final script
    let formattedScript = '';

    if (includeIntro) {
      const intros = {
        casual: `Hey there! I'm your AI coding buddy, and today we're going to tackle: ${problemTitle}. Let's dive in!`,
        professional: `Good day. I'm your AI programming instructor, and I'll be explaining the solution to: ${problemTitle}.`,
        educational: `Hello! I'm your AI coding instructor, and today I'll explain how to solve: ${problemTitle}.`,
        enthusiastic: `Hey everyone! I'm super excited to show you how to solve: ${problemTitle}! This is going to be awesome!`
      };
      formattedScript += intros[speakingStyle] + '\n\n';
    }

    formattedScript += cleanScript;

    if (includeConclusion) {
      const conclusions = {
        casual: `\n\nAnd that's how we solve it! Pretty cool, right? Keep practicing and you'll master this in no time!`,
        professional: `\n\nThis concludes our solution explanation. I recommend practicing similar problems to reinforce these concepts.`,
        educational: `\n\nThat's how we solve this problem! Remember to practice these concepts and try implementing variations. Happy coding!`,
        enthusiastic: `\n\nWow! We did it! That was an amazing solution! Keep coding and keep learning - you're doing great!`
      };
      formattedScript += conclusions[speakingStyle];
    }

    return formattedScript.trim();
  }

  /**
   * Generate video explanation for a coding problem with enhanced options
   */
  static async generateProblemExplanation(
    problemTitle: string,
    script: string,
    language: string,
    replicaId?: string,
    personaId?: string,
    options?: {
      background?: string;
      voiceSettings?: TavusVideoRequest['voice_settings'];
      videoSettings?: TavusVideoRequest['video_settings'];
      scriptOptions?: Parameters<typeof TavusService.formatScriptForVideo>[2];
    }
  ): Promise<TavusVideoResponse> {
    const formattedScript = this.formatScriptForVideo(
      script, 
      problemTitle, 
      options?.scriptOptions
    );
    
    const videoRequest: TavusVideoRequest = {
      script: formattedScript,
      replica_id: replicaId,
      persona_id: personaId,
      video_name: `${problemTitle} - ${language} Solution`,
      background_url: options?.background || 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=1920&h=1080&fit=crop',
      voice_settings: options?.voiceSettings,
      video_settings: options?.videoSettings
    };

    return this.generateVideo(videoRequest);
  }

  /**
   * Enhanced video status polling with detailed progress tracking
   */
  static async pollVideoStatus(
    videoId: string,
    onProgress?: (status: string, progress?: number) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<TavusVideoResponse> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const video = await this.getVideo(videoId);
        
        // Calculate progress based on status
        let progress = 0;
        switch (video.status) {
          case 'queued':
            progress = 10;
            break;
          case 'generating':
            progress = 30 + (attempts * 2); // Gradual increase
            break;
          case 'processing':
            progress = 80 + (attempts * 1);
            break;
          case 'completed':
            progress = 100;
            break;
        }

        if (onProgress) {
          onProgress(video.status, Math.min(progress, 95));
        }

        if (video.status === 'completed') {
          if (onProgress) onProgress('completed', 100);
          return video;
        }

        if (video.status === 'failed') {
          throw new Error('Video generation failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
      } catch (error) {
        console.error('Error polling video status:', error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error('Video generation timeout');
  }

  /**
   * Enhanced error handling
   */
  private static handleApiError(error: any): void {
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 401:
          throw new Error('Tavus API key is unauthorized. Please verify your API key is correct.');
        case 402:
          throw new Error('Tavus API key is invalid or account has insufficient credits. Please check your Tavus account dashboard and ensure you have an active subscription.');
        case 403:
          throw new Error('Access forbidden. Your API key may not have the required permissions.');
        case 429:
          throw new Error('Tavus API rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Tavus API server error. Please try again later.');
        default:
          throw new Error(`Tavus API error: ${error.response?.status} - ${error.response?.statusText}`);
      }
    }
    throw error;
  }

  /**
   * Get account usage statistics
   */
  static async getUsageStats(): Promise<{
    videosGenerated: number;
    creditsUsed: number;
    creditsRemaining: number;
    subscriptionStatus: string;
  }> {
    try {
      if (!TAVUS_API_KEY) {
        throw new Error('Tavus API key not configured');
      }

      const response = await tavusClient.get('/v2/account/usage');
      return response.data;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return {
        videosGenerated: 0,
        creditsUsed: 0,
        creditsRemaining: 0,
        subscriptionStatus: 'unknown'
      };
    }
  }
}