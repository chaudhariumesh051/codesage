import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Globe, 
  MapPin, 
  Clock, 
  Save, 
  Trash2, 
  AlertTriangle,
  Shield,
  Moon,
  Sun,
  Code,
  LogOut
} from 'lucide-react';
import { AuthService } from '../services/auth';
import { showToast } from './Toast';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from './AuthProvider';

export const SettingsPanel: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, refreshUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    bio: '',
    website: '',
    location: '',
    timezone: 'UTC',
    avatarUrl: ''
  });

  const [preferencesData, setPreferencesData] = useState({
    preferredLanguage: 'javascript',
    theme: 'system',
  });

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // Predefined avatars
  const avatarOptions = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces'
  ];

  useEffect(() => {
    loadUserData();
    loadSessions();
    loadSecurityLogs();
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.full_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        location: profile.location || '',
        timezone: profile.timezone || 'UTC',
        avatarUrl: profile.avatar_url || ''
      });
      
      setSelectedAvatar(profile.avatar_url || null);
    }
  }, [profile]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get preferences
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (preferences) {
        setPreferencesData({
          preferredLanguage: preferences.default_language || 'javascript',
          theme: profile?.theme || 'system',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const sessions = await AuthService.getUserSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const logs = await AuthService.getSecurityLogs();
      setSecurityLogs(logs);
    } catch (error) {
      console.error('Error loading security logs:', error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setPreferencesData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
    setProfileData(prev => ({ ...prev, avatarUrl: url }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Update profile
      await AuthService.updateProfile({
        full_name: profileData.fullName,
        avatar_url: profileData.avatarUrl,
        bio: profileData.bio,
        website: profileData.website,
        location: profileData.location,
        timezone: profileData.timezone
      });
      
      // Update preferences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          default_language: preferencesData.preferredLanguage,
          updated_at: new Date().toISOString()
        });
        
      // Update theme preference
      await supabase
        .from('user_profiles')
        .update({
          theme: preferencesData.theme,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      showToast.success('Profile updated successfully!');
      
      // Reload user data
      refreshUser();
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await AuthService.revokeSession(sessionId);
      showToast.success('Session revoked successfully');
      loadSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      showToast.error('Failed to revoke session');
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      showToast.error('Failed to sign out');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Profile Picture
              </label>
              <div className="flex flex-wrap gap-4 mb-4">
                {avatarOptions.map((url, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAvatarSelect(url)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 ${
                      selectedAvatar === url 
                        ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <img 
                      src={url} 
                      alt={`Avatar option ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
                
                {/* Current avatar if not in options */}
                {selectedAvatar && !avatarOptions.includes(selectedAvatar) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700"
                  >
                    <img 
                      src={selectedAvatar} 
                      alt="Current avatar" 
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={user?.email}
                    disabled
                    className="pl-10 w-full px-4 py-3 bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Email cannot be changed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timezone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="timezone"
                    name="timezone"
                    value={profileData.timezone}
                    onChange={handleProfileChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={profileData.website}
                    onChange={handleProfileChange}
                    className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={profileData.location}
                  onChange={handleProfileChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={profileData.bio}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        );
        
      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Globe }
                ].map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <motion.button
                      key={theme.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setPreferencesData(prev => ({ ...prev, theme: theme.id }));
                        if (theme.id !== 'system') {
                          toggleTheme();
                        }
                      }}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center ${
                        preferencesData.theme === theme.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${
                        preferencesData.theme === theme.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{theme.label}</div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Programming Language
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Code className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  value={preferencesData.preferredLanguage}
                  onChange={handlePreferencesChange}
                  className="pl-10 w-full px-4 py-3 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="typescript">TypeScript</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="csharp">C#</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Security Settings</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Manage your account security settings, active sessions, and view security logs.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Password</h3>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => AuthService.resetPassword(user?.email)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Change Password
              </motion.button>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Active Sessions</h3>
              <div className="space-y-3">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${session.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {session.device_name || 'Unknown Device'}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {session.browser} • {session.os} • {session.ip_address}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last active: {formatDate(session.last_accessed_at)}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        Revoke
                      </motion.button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No active sessions found.</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Security Logs</h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-dark-600 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                  <thead className="bg-gray-50 dark:bg-dark-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                    {securityLogs.length > 0 ? (
                      securityLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {log.event_type.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {log.ip_address || 'Unknown'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No security logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Account</h3>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Coming Soon</h3>
            <p className="text-gray-600 dark:text-gray-400">Settings for {activeTab} are being developed!</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden shadow-lg">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-dark-700">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'preferences', label: 'Preferences', icon: Globe },
          { id: 'security', label: 'Security', icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-3 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        )}
        
        {/* Action Buttons */}
        {(activeTab === 'profile' || activeTab === 'preferences') && (
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                if (profile) {
                  setProfileData({
                    fullName: profile.full_name || '',
                    bio: profile.bio || '',
                    website: profile.website || '',
                    location: profile.location || '',
                    timezone: profile.timezone || 'UTC',
                    avatarUrl: profile.avatar_url || ''
                  });
                  setSelectedAvatar(profile.avatar_url || null);
                }
              }}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};