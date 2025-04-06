import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, User, Building2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [userType, setUserType] = React.useState<'student' | 'management' | null>(null);
  const [formData, setFormData] = React.useState({
    id: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const requestData = new URLSearchParams();
      requestData.append('college_id', formData.id);
      requestData.append('password', formData.password);

      const response = await axios.post('http://localhost:8000/login', requestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      localStorage.setItem('token', response.data.access_token);
      if (response.data.user_type === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/management/dashboard');
      }
      toast.success('Login successful!');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl"
      >
        <div className="text-center">
          <div className="flex justify-center">
            <Wrench className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">CampusFix</h2>
          <p className="mt-2 text-sm text-gray-600">Bringing seamless campus issue resolution</p>
        </div>

        {!userType ? (
          <div className="grid grid-cols-2 gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserType('student')}
              className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <User className="h-8 w-8 text-blue-600" />
              <span className="mt-2 font-medium">Student</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserType('management')}
              className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="mt-2 font-medium">Management</span>
            </motion.button>
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-6"
            onSubmit={handleLogin} 
          >
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="id" className="sr-only">
                  {userType === 'student' ? 'College ID' : 'Management ID'}
                </label>
                <input
                  id="id"
                  name="id"
                  type="text"
                  required
                  value={formData.id}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={userType === 'student' ? 'College ID' : 'Management ID'}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Login
              </motion.button>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setUserType(null)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ← Change user type
              </button>
              <Link
                to="/register"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                New user? Register here →
              </Link>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};