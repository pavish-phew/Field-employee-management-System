import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { UserPlus, Users, MapPin, Mail, Phone, Lock, Home } from 'lucide-react';

const AdminUserManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);
    const [type, setType] = useState('EMPLOYEE'); // EMPLOYEE or CLIENT
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', address: '', latitude: 0, longitude: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [empRes, cliRes] = await Promise.all([adminApi.getEmployees(), adminApi.getClients()]);
            setEmployees(empRes.data);
            setClients(cliRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (type === 'EMPLOYEE') {
                await adminApi.createEmployee(formData);
                alert("Employee created!");
            } else {
                await adminApi.createClient(formData);
                alert("Client created!");
            }
            fetchData();
            setFormData({ name: '', email: '', password: '', phone: '', address: '', latitude: 0, longitude: 0 });
        } catch (err) {
            alert("Create failed: " + (err.response?.data || err.message));
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight dark:text-white">Admin Management</h1>
                    <p className="text-slate-500 mt-2 font-medium">Create and manage your workforce and clients.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Creation Form */}
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setType('EMPLOYEE')}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${type === 'EMPLOYEE' ? 'bg-white shadow-md text-blue-600 dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Employee
                        </button>
                        <button
                            onClick={() => setType('CLIENT')}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${type === 'CLIENT' ? 'bg-white shadow-md text-blue-600 dark:bg-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Client
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Full Name</label>
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pt-6 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Users size={18} />
                                </div>
                                <input
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    placeholder=""
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="relative group">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Email Address</label>
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pt-6 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email" required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    placeholder=""
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="relative group">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Password</label>
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pt-6 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password" required
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            {type === 'EMPLOYEE' && (
                                <div className="relative group">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Phone Number</label>
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pt-6 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            )}

                            {type === 'CLIENT' && (
                                <>
                                    <div className="relative group">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Address</label>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pt-6 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Home size={18} />
                                        </div>
                                        <input
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                            placeholder="123 Field St, City"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Latitude</label>
                                            <input
                                                type="number" step="any" required
                                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                                value={formData.latitude}
                                                onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Longitude</label>
                                            <input
                                                type="number" step="any" required
                                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                                value={formData.longitude}
                                                onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4">
                            <UserPlus size={20} />
                            Create {type === 'EMPLOYEE' ? 'Employee' : 'Client'}
                        </button>
                    </form>
                </div>

                {/* List View */}
                <div className="space-y-8 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
                    <section>
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-white">
                            <Users className="text-blue-500" /> Employees List
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {employees.map((emp, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all dark:bg-slate-800 dark:border-slate-700">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-lg text-slate-900 dark:text-white">{emp.user?.name}</p>
                                            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                                <Mail size={14} /> {emp.user?.email}
                                            </p>
                                        </div>
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">EMPLOYEE</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-white">
                            <MapPin className="text-emerald-500" /> Clients List
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {clients.map((cli, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all dark:bg-slate-800 dark:border-slate-700">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-lg text-slate-900 dark:text-white">{cli.user?.name}</p>
                                            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1 italic">
                                                <MapPin size={14} /> {cli.address}
                                            </p>
                                        </div>
                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">CLIENT</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;
