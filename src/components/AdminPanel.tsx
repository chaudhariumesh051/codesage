import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Trash2, 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Loader,
  User,
  Mail,
  Calendar,
  Code,
  Lightbulb
} from 'lucide-react';
import { AuthService } from '../services/auth';
import { showToast } from './Toast';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<Record<string, any>>({});

  // Check if current user is admin
  const isAdmin = profile?.is_admin === true;

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
      
      // Load stats for each user
      const stats: Record<string, any> = {};
      for (const user of data || []) {
        stats[user.id] = await getUserStats(user.id);
      }
      
      setUserStats(stats);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
      showToast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserStats = async (userId: string) => {
    try {
      const { data: analyses, error: analysesError } = await supabase
        .from('code_analyses')
        .select('id')
        .eq('user_id', userId);
        
      const { data: solutions, error: solutionsError } = await supabase
        .from('problem_solutions')
        .select('id')
        .eq('user_id', userId);
        
      return {
        analyses: analyses?.length || 0,
        solutions: solutions?.length || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { analyses: 0, solutions: 0 };
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(userId);
      
      // Call admin function to delete user
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });
      
      if (error) {
        throw error;
      }
      
      showToast.success('User deleted successfully');
      setUsers(users.filter(user => user.id !== userId));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      showToast.error(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !isAdmin })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      showToast.success(`User ${isAdmin ? 'removed from' : 'added to'} admins`);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !isAdmin } : user
      ));
    } catch (err: any) {
      console.error('Error updating user admin status:', err);
      showToast.error(err.message || 'Failed to update user');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300">Access Denied</h2>
          </div>
          <p className="text-red-700 dark:text-red-400 mb-4">
            You don't have permission to access the admin panel. This area is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users and system settings
          </p>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full md:w-64 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Users Management
            </h2>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadUsers}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No users match your search' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.full_name || 'User'} 
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {user.full_name || 'Unnamed User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {user.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">{formatDate(user.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-1">
                            <Code className="w-4 h-4 text-blue-500" />
                            <span className="text-gray-700 dark:text-gray-300">{userStats[user.id]?.analyses || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Lightbulb className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">{userStats[user.id]?.solutions || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.is_admin 
                            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' 
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                        }`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            className={`p-2 rounded-lg ${
                              user.is_admin
                                ? 'text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20'
                                : 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                            }`}
                            title={user.is_admin ? 'Remove admin rights' : 'Make admin'}
                          >
                            <Shield className="w-5 h-5" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isDeleting === user.id || user.id === profile?.id}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete user"
                          >
                            {isDeleting === user.id ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};