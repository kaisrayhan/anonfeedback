import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, MessageSquare, Shield, LogOut, Plus, Trash2, Edit2, ChevronRight, Info, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, checkSupabaseConnection } from './lib/supabase';
import { Employee, Feedback } from './types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from './lib/utils';

// --- Components ---

const Navbar = ({ isAdmin, onLogout }: { isAdmin: boolean; onLogout: () => void }) => (
  <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-gray-100">
    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
          <MessageSquare size={18} />
        </div>
        <span>AnonFeedback</span>
      </Link>
      <div className="flex items-center gap-4">
        {isAdmin ? (
          <>
            <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-black">Dashboard</Link>
            <button onClick={onLogout} className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link to="/admin/login" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-black">
            <Shield size={16} />
            <span>Admin</span>
          </Link>
        )}
      </div>
    </div>
  </nav>
);

const EmployeeCard = ({ employee }: { employee: Employee }) => (
  <Link 
    to={`/employee/${employee.id}`}
    className="group bg-white border border-gray-200 rounded-2xl p-4 transition-all hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
  >
    <div className="flex items-center gap-4">
      <img 
        src={employee.image_url || `https://picsum.photos/seed/${employee.id}/200`} 
        alt={employee.name}
        className="w-16 h-16 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all"
        referrerPolicy="no-referrer"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{employee.name}</h3>
        <p className="text-sm text-gray-500 truncate">{employee.designation}</p>
        {employee.department && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500 rounded">
            {employee.department}
          </span>
        )}
      </div>
      <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
    </div>
  </Link>
);

// --- Pages ---

const Home = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('name');
        if (error) throw error;
        if (data) setEmployees(data);
      } catch (err: any) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  const [connectionStatus, setConnectionStatus] = useState<{ loading: boolean; success?: boolean; error?: string }>({ loading: true });

  useEffect(() => {
    const checkConnection = async () => {
      const result = await checkSupabaseConnection();
      setConnectionStatus({ loading: false, ...result });
    };
    if (isSupabaseConfigured) checkConnection();
    else setConnectionStatus({ loading: false, success: false, error: 'Not configured' });
  }, [isSupabaseConfigured]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {!isSupabaseConfigured ? (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl text-amber-800 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3 font-bold">
            <AlertCircle size={20} />
            <span>Supabase Configuration Required</span>
          </div>
          <p className="text-sm leading-relaxed">
            To get started, you must add your Supabase credentials to the <strong>Secrets</strong> panel in the AI Studio UI (bottom left).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-white/50 p-3 rounded-xl border border-amber-100">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Key</span>
              <code className="text-xs break-all">VITE_SUPABASE_URL</code>
            </div>
            <div className="bg-white/50 p-3 rounded-xl border border-amber-100">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Key</span>
              <code className="text-xs break-all">VITE_SUPABASE_ANON_KEY</code>
            </div>
          </div>
        </div>
      ) : connectionStatus.error && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-3xl text-red-800 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3 font-bold">
            <AlertCircle size={20} />
            <span>Database Connection Error</span>
          </div>
          <p className="text-sm leading-relaxed">
            Connected to Supabase, but could not access the <code>employees</code> table. 
            <strong> Did you run the SQL migration?</strong>
          </p>
          <div className="bg-white/50 p-3 rounded-xl border border-red-100">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">Error Message</span>
            <code className="text-xs break-all">{connectionStatus.error}</code>
          </div>
        </div>
      )}
      <header className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold tracking-tight text-gray-900 mb-4"
        >
          Workplace Transparency
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-500 max-w-2xl mx-auto"
        >
          Submit anonymous feedback about any employee. All feedback is publicly visible to foster a culture of honesty and growth.
        </motion.p>
        
        <div className="mt-8 relative max-w-md mx-auto">
          <input 
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all shadow-sm"
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map(employee => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
          {filteredEmployees.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              No employees found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EmployeeProfile = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        const [empRes, feedRes] = await Promise.all([
          supabase.from('employees').select('*').eq('id', id).single(),
          supabase.from('feedback').select('*').eq('employee_id', id).order('created_at', { ascending: false })
        ]);

        if (empRes.error) throw empRes.error;
        if (feedRes.error) throw feedRes.error;

        if (empRes.data) setEmployee(empRes.data);
        if (feedRes.data) setFeedbacks(feedRes.data);
      } catch (err: any) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !id) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('feedback')
      .insert([{ employee_id: id, message: message.trim() }])
      .select()
      .single();

    if (data) {
      setFeedbacks([data, ...feedbacks]);
      setMessage('');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-24 text-center">Loading...</div>;
  if (!employee) return <div className="max-w-3xl mx-auto px-4 py-24 text-center">Employee not found.</div>;

  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {!isSupabaseConfigured && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex items-center gap-3">
          <Info size={18} />
          <p>
            <strong>Supabase not configured.</strong> Please add your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the AI Studio Secrets panel.
          </p>
        </div>
      )}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8">
        <ChevronRight size={16} className="rotate-180" />
        Back to Directory
      </Link>

      <section className="bg-white border border-gray-200 rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
        <img 
          src={employee.image_url || `https://picsum.photos/seed/${employee.id}/200`} 
          alt={employee.name}
          className="w-32 h-32 rounded-2xl object-cover grayscale"
          referrerPolicy="no-referrer"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
          <p className="text-lg text-gray-500">{employee.designation}</p>
          {employee.department && (
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-gray-400">{employee.department}</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-12">
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare size={20} />
            Submit Anonymous Feedback
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to say? Be honest, but respectful."
              className="w-full h-32 px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Info size={12} />
                Your feedback is 100% anonymous.
              </p>
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Submitting...' : 'Post Feedback'}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-6">Recent Feedback ({feedbacks.length})</h2>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {feedbacks.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-6"
                >
                  <p className="text-gray-800 leading-relaxed mb-4">{f.message}</p>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Anonymous User</span>
                    <span>{formatDistanceToNow(new Date(f.created_at))} ago</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {feedbacks.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400">
                No feedback yet. Be the first to share your thoughts.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        onLogin();
        navigate('/admin');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl shadow-black/5">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-gray-500">Please enter your credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{ loading: boolean; success?: boolean; error?: string }>({ loading: true });
  
  // Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const testConnection = async () => {
    setConnectionStatus({ loading: true });
    const result = await checkSupabaseConnection();
    setConnectionStatus({ loading: false, ...result });
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      if (data) setEmployees(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
    fetchEmployees();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, designation, department, image_url: imageUrl };

    try {
      if (editingEmployee) {
        const { error } = await supabase.from('employees').update(payload).eq('id', editingEmployee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('employees').insert([payload]);
        if (error) throw error;
      }
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      alert('Error saving employee: ' + (err.message || 'Unknown error'));
      console.error('Save error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all feedback for this employee.')) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      fetchEmployees();
    } catch (err: any) {
      alert('Error deleting employee: ' + (err.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setName('');
    setDesignation('');
    setDepartment('');
    setImageUrl('');
    setEditingEmployee(null);
    setIsAdding(false);
  };

  const startEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setDesignation(emp.designation);
    setDepartment(emp.department || '');
    setImageUrl(emp.image_url);
    setIsAdding(true);
  };

  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {!isSupabaseConfigured && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex items-center gap-3">
          <Info size={18} />
          <p>
            <strong>Supabase not configured.</strong> Please add your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the AI Studio Secrets panel.
          </p>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className={cn(
          "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 border",
          connectionStatus.loading ? "bg-gray-50 text-gray-400 border-gray-200" :
          connectionStatus.success ? "bg-green-50 text-green-600 border-green-200" :
          "bg-red-50 text-red-600 border-red-200"
        )}>
          {connectionStatus.loading ? <RefreshCw size={14} className="animate-spin" /> :
           connectionStatus.success ? <CheckCircle2 size={14} /> :
           <AlertCircle size={14} />}
          <span>
            Database: {connectionStatus.loading ? 'Checking...' : connectionStatus.success ? 'Connected' : 'Error'}
          </span>
        </div>
        {!connectionStatus.success && !connectionStatus.loading && (
          <p className="text-xs text-red-500 font-medium max-w-md">
            {connectionStatus.error}. Make sure the <code>employees</code> table exists and RLS allows access.
          </p>
        )}
        <button 
          onClick={testConnection}
          className="p-2 text-gray-400 hover:text-black transition-colors"
          title="Retry Connection Test"
        >
          <RefreshCw size={14} className={connectionStatus.loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Employees</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
        >
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6">
              <h2 className="text-xl font-bold">{editingEmployee ? 'Edit Employee' : 'New Employee'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Designation</label>
                  <input type="text" required value={designation} onChange={e => setDesignation(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Department</label>
                  <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Image URL</label>
                  <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black" />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all">
                  {editingEmployee ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Employee</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Role</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={emp.image_url || `https://picsum.photos/seed/${emp.id}/200`} className="w-10 h-10 rounded-lg object-cover grayscale" referrerPolicy="no-referrer" />
                    <span className="font-semibold text-gray-900">{emp.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{emp.designation}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(emp)} className="p-2 text-gray-400 hover:text-black transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/check');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.authenticated);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors
    }
    setIsAdmin(false);
  };

  if (checkingAuth) return null;

  return (
    <Router>
      <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans">
        <Navbar isAdmin={isAdmin} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/employee/:id" element={<EmployeeProfile />} />
            <Route path="/admin/login" element={<AdminLogin onLogin={() => setIsAdmin(true)} />} />
            <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <AdminLogin onLogin={() => setIsAdmin(true)} />} />
          </Routes>
        </main>
        <footer className="py-12 border-t border-gray-100 mt-24">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-400 font-medium">
              &copy; {new Date().getFullYear()} AnonFeedback. Built for workplace honesty.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
