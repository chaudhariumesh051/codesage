import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Play, 
  Download, 
  Share2, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  Clock,
  User,
  Settings,
  Trash2,
  Timer,
  BarChart3,
  Palette,
  Volume2,
  Monitor,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react';
import { TavusService, TavusVideoResponse, TavusReplica, TavusPersona, TavusBackground } from '../services/tavus';
import { VideoPlayer } from './VideoPlayer';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { showToast } from './Toast';

interface VideoGeneratorProps {
  problemTitle: string;
  script: string;
  language: string;
  onVideoGenerated?: (video: TavusVideoResponse) => void;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  problemTitle,
  script,
  language,
  onVideoGenerated
}) => {
  const { subscription, canUseFeature } = useSubscriptionStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [video, setVideo] = useState<TavusVideoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replicas, setReplicas] = useState<TavusReplica[]>([]);
  const [personas, setPersonas] = useState<TavusPersona[]>([]);
  const [backgrounds, setBackgrounds] = useState<TavusBackground[]>([]);
  const [selectedReplica, setSelectedReplica] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedBackground, setSelectedBackground] = useState<string>('');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [generatedVideosCount, setGeneratedVideosCount] = useState<number>(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  // Advanced settings
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    volume: 1.0
  });

  const [videoSettings, setVideoSettings] = useState({
    quality: 'high' as 'low' | 'medium' | 'high' | 'ultra',
    resolution: '1080p' as '720p' | '1080p' | '4k',
    fps: 30 as 24 | 30 | 60
  });

  const [scriptOptions, setScriptOptions] = useState({
    includeIntro: true,
    includeConclusion: true,
    speakingStyle: 'educational' as 'casual' | 'professional' | 'educational' | 'enthusiastic',
    pace: 'normal' as 'slow' | 'normal' | 'fast'
  });

  // Timer for elapsed time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Test API connection and load data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const connectionResult = await TavusService.testConnection();
        setApiConnected(connectionResult.connected);
        setAccountInfo(connectionResult.accountInfo);
        
        if (connectionResult.connected) {
          // Load available resources
          const [availableReplicas, availablePersonas, availableBackgrounds] = await Promise.all([
            TavusService.getReplicas(),
            TavusService.getPersonas(),
            TavusService.getBackgrounds()
          ]);
          
          setReplicas(availableReplicas);
          setPersonas(availablePersonas);
          setBackgrounds(availableBackgrounds);
          
          // Auto-select defaults
          if (availableReplicas.length > 0) {
            // For free users, select first free replica; for pro users, select first replica
            const defaultReplica = subscription.isActive 
              ? availableReplicas[0] 
              : availableReplicas.find(r => !r.is_premium) || availableReplicas[0];
            setSelectedReplica(defaultReplica.replica_id);
          }
          
          if (availablePersonas.length > 0) {
            const defaultPersona = subscription.isActive 
              ? availablePersonas[0] 
              : availablePersonas.find(p => !p.is_premium) || availablePersonas[0];
            setSelectedPersona(defaultPersona.persona_id);
          }
          
          if (availableBackgrounds.length > 0) {
            const defaultBackground = subscription.isActive 
              ? availableBackgrounds[0] 
              : availableBackgrounds.find(b => !b.is_premium) || availableBackgrounds[0];
            setSelectedBackground(defaultBackground.url);
          }

          // Load generated videos count from localStorage
          const savedCount = localStorage.getItem('generatedVideosCount');
          if (savedCount) {
            setGeneratedVideosCount(parseInt(savedCount, 10));
          }
        } else {
          setError(connectionResult.error || 'Failed to connect to Tavus API');
        }
      } catch (error) {
        console.error('Failed to initialize Tavus data:', error);
        setApiConnected(false);
        setError(error instanceof Error ? error.message : 'Failed to connect to Tavus API');
      }
    };

    initializeData();
  }, [subscription.isActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateGenerationProgress = (status: string, progress?: number) => {
    if (progress !== undefined) {
      setGenerationProgress(progress);
    }

    switch (status) {
      case 'queued':
        setGenerationProgress(10);
        setEstimatedTime(180);
        setGenerationStatus('Video queued for processing...');
        break;
      case 'generating':
        setEstimatedTime(120);
        setGenerationStatus('AI is generating your video explanation...');
        break;
      case 'processing':
        setEstimatedTime(60);
        setGenerationStatus('Finalizing video and adding effects...');
        break;
      case 'completed':
        setGenerationProgress(100);
        setEstimatedTime(0);
        setGenerationStatus('Video generation completed!');
        break;
      case 'failed':
        setGenerationProgress(0);
        setEstimatedTime(0);
        setGenerationStatus('Video generation failed');
        break;
      default:
        setGenerationStatus(`Status: ${status}`);
    }
  };

  const handleGenerateVideo = async () => {
    // Check if user can use video generation feature
    if (!canUseFeature('videoGeneration')) {
      showToast.upgrade('Video generation is a Pro feature. Upgrade to create AI video explanations!');
      return;
    }

    if (!script.trim()) {
      setError('Script is required to generate video');
      showToast.error('Script is required to generate video');
      return;
    }

    if (!selectedReplica && replicas.length === 0) {
      setError('No AI presenter available. Please check your Tavus API key and account settings.');
      showToast.error('No AI presenter available');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(5);
    setGenerationStatus('Initializing video generation...');

    try {
      // Generate video with enhanced options
      const videoResponse = await TavusService.generateProblemExplanation(
        problemTitle,
        script,
        language,
        selectedReplica,
        selectedPersona,
        {
          background: selectedBackground,
          voiceSettings: voiceSettings,
          videoSettings: videoSettings,
          scriptOptions: scriptOptions
        }
      );

      setGenerationProgress(15);
      setGenerationStatus('Video request submitted successfully...');

      // Poll for completion with progress updates
      const completedVideo = await TavusService.pollVideoStatus(
        videoResponse.video_id,
        updateGenerationProgress
      );

      setVideo(completedVideo);
      setGenerationStatus('');
      setGenerationProgress(0);
      
      // Update generated videos count
      const newCount = generatedVideosCount + 1;
      setGeneratedVideosCount(newCount);
      localStorage.setItem('generatedVideosCount', newCount.toString());
      
      if (onVideoGenerated) {
        onVideoGenerated(completedVideo);
      }

      showToast.success('Video generated successfully! 🎉');

    } catch (error) {
      console.error('Video generation failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate video');
      setGenerationStatus('');
      setGenerationProgress(0);
      showToast.error('Video generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = () => {
    if (video?.download_url) {
      window.open(video.download_url, '_blank');
      showToast.success('Video download started!');
    }
  };

  const handleShareVideo = async () => {
    if (video?.download_url) {
      try {
        await navigator.share({
          title: `${problemTitle} - Video Explanation`,
          text: `Check out this AI-generated explanation for: ${problemTitle}`,
          url: video.download_url,
        });
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(video.download_url);
        showToast.success('Video URL copied to clipboard!');
      }
    }
  };

  const handleDeleteVideo = async () => {
    if (!video) return;

    if (confirm('Are you sure you want to delete this video?')) {
      try {
        await TavusService.deleteVideo(video.video_id);
        setVideo(null);
        showToast.success('Video deleted successfully');
      } catch (error) {
        console.error('Failed to delete video:', error);
        showToast.error('Failed to delete video');
      }
    }
  };

  // Show API connection status
  if (apiConnected === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Connecting to Tavus AI...</span>
        </div>
      </div>
    );
  }

  if (apiConnected === false) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h3 className="font-semibold text-red-900 dark:text-red-300">Tavus AI Connection Failed</h3>
        </div>
        <p className="text-red-800 dark:text-red-300 mb-4">
          {error || 'Unable to connect to Tavus AI video generation service. Please check your API configuration and account status.'}
        </p>
        <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400 font-mono mb-2">
            VITE_TAVUS_API_KEY=your_tavus_api_key_here
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">
            Make sure your API key is valid and your Tavus account has sufficient credits or an active subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Info & Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-300">
              Video Generation Stats
            </span>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-purple-700 dark:text-purple-400">{generatedVideosCount}</div>
              <div className="text-purple-600 dark:text-purple-500">Generated</div>
            </div>
            {accountInfo && (
              <div className="text-center">
                <div className="font-bold text-blue-700 dark:text-blue-400">{accountInfo.creditsRemaining || 'N/A'}</div>
                <div className="text-blue-600 dark:text-blue-500">Credits</div>
              </div>
            )}
            {isGenerating && (
              <div className="text-center">
                <div className="font-bold text-orange-700 dark:text-orange-400">{formatTime(elapsedTime)}</div>
                <div className="text-orange-600 dark:text-orange-500">Elapsed</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Generation Controls */}
      {!video && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Generate AI Video Explanation
                </h3>
                {!subscription.isActive && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center space-x-1">
                    <Crown className="w-4 h-4" />
                    <span>Pro feature - Upgrade to unlock</span>
                  </p>
                )}
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Advanced</span>
            </motion.button>
          </div>

          {/* AI Presenter Selection */}
          {subscription.isActive && replicas.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose AI Presenter
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {replicas.map((replica) => (
                  <motion.button
                    key={replica.replica_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedReplica(replica.replica_id)}
                    className={`relative p-3 rounded-xl border-2 transition-all ${
                      selectedReplica === replica.replica_id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                    }`}
                  >
                    {replica.thumbnail_url ? (
                      <img
                        src={replica.thumbnail_url}
                        alt={replica.name}
                        className="w-full h-20 object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-2 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {replica.name}
                    </p>
                    {replica.is_premium && (
                      <div className="absolute top-1 right-1">
                        <Crown className="w-4 h-4 text-yellow-500" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <AnimatePresence>
            {showAdvancedSettings && subscription.isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 space-y-6"
              >
                {/* Background Selection */}
                {backgrounds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Background
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {backgrounds.map((background) => (
                        <motion.button
                          key={background.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedBackground(background.url)}
                          className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                            selectedBackground === background.url
                              ? 'border-purple-500'
                              : 'border-gray-200 dark:border-dark-600'
                          }`}
                        >
                          <img
                            src={background.url}
                            alt={background.name}
                            className="w-full h-full object-cover"
                          />
                          {background.is_premium && (
                            <div className="absolute top-1 right-1">
                              <Crown className="w-3 h-3 text-yellow-500" />
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voice Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Voice Settings
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Speed</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceSettings.speed}
                        onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{voiceSettings.speed}x</span>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Pitch</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceSettings.pitch}
                        onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{voiceSettings.pitch}x</span>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Volume</label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={voiceSettings.volume}
                        onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{voiceSettings.volume}x</span>
                    </div>
                  </div>
                </div>

                {/* Script Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Speaking Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['casual', 'professional', 'educational', 'enthusiastic'].map((style) => (
                      <motion.button
                        key={style}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setScriptOptions(prev => ({ ...prev, speakingStyle: style as any }))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          scriptOptions.speakingStyle === style
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateVideo}
            disabled={isGenerating || !script.trim() || (!subscription.isActive && !canUseFeature('videoGeneration'))}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generating Video...</span>
              </>
            ) : !subscription.isActive ? (
              <>
                <Crown className="w-5 h-5" />
                <span>Upgrade to Generate AI Videos</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span>Generate AI Video Explanation</span>
              </>
            )}
          </motion.button>

          {/* Generation Progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 space-y-4"
              >
                {/* Progress Bar */}
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                </div>

                {/* Status and Time Info */}
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span className="text-blue-800 dark:text-blue-300">{generationStatus}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-blue-700 dark:text-blue-400">
                      <span className="font-medium">{generationProgress}%</span> complete
                    </div>
                    {estimatedTime > 0 && (
                      <div className="text-blue-700 dark:text-blue-400">
                        ~{formatTime(estimatedTime)} remaining
                      </div>
                    )}
                  </div>
                </div>

                {/* Generation Tips */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>💡 Tip:</strong> Video generation typically takes 2-5 minutes. The AI is creating a personalized explanation with your selected presenter and settings!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-800 dark:text-red-300">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Generated Video Display */}
      <AnimatePresence>
        {video && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden"
          >
            {/* Video Header */}
            <div className="p-6 border-b border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      AI Video Explanation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generated by Tavus AI • {video.duration ? `${Math.round(video.duration)}s` : 'Processing...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadVideo}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Download video"
                  >
                    <Download className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShareVideo}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Share video"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteVideo}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete video"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Video Player */}
            <div className="p-6">
              {video.download_url ? (
                <VideoPlayer
                  videoUrl={video.download_url}
                  thumbnailUrl={video.thumbnail_url}
                  title={`${problemTitle} - ${language} Solution`}
                  onDownload={handleDownloadVideo}
                  onShare={handleShareVideo}
                />
              ) : (
                <div className="aspect-video bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Video is still processing...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {video.status}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Language</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{language}</p>
                </div>
                <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quality</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {video.quality || 'High'} • {video.resolution || '1080p'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};