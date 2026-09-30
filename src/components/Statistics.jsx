import { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Statistics.css';

export default function Statistics() {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMovements();
    }, []);

    const fetchMovements = async () => {
        try {
            const { data, error } = await supabase
                .from('movements')
                .select('*');

            if (error) throw error;
            setMovements(data || []);
        } catch (error) {
            console.error('Error fetching movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        const expenseByResponsible = {};
        const expenseByMonth = {};

        movements.forEach(m => {
            const amount = parseFloat(m.amount || 0);
            // Ensure date parsing works for 'yyyy-mm-dd'
            const [year, month, day] = m.date.split('-');
            // Simple aggregation key
            const monthKey = `${month}/${year}`;

            if (m.type === 'income') {
                totalIncome += amount;
            } else {
                totalExpense += amount;

                // By Responsible
                const resp = m.company || 'Sin asignar';
                expenseByResponsible[resp] = (expenseByResponsible[resp] || 0) + amount;

                // By Month
                expenseByMonth[monthKey] = (expenseByMonth[monthKey] || 0) + amount;
            }
        });

        const pieData = Object.entries(expenseByResponsible).map(([name, value]) => ({ name, value }));
        const barData = Object.entries(expenseByMonth).map(([name, value]) => ({ name, value }));

        return { totalIncome, totalExpense, pieData, barData };
    }, [movements]);

    const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

    if (loading) {
        return <div className="text-center p-8">Cargando estadísticas...</div>;
    }

    return (
        <div className="stats-container fade-in">
            {/* KPIs */}
            <div className="kpi-grid">
                <div className="card kpi-card">
                    <div className="kpi-icon income"><TrendingUp size={24} /></div>
                    <div className="kpi-info">
                        <h3>Total Ingresado</h3>
                        <p>${stats.totalIncome.toLocaleString()}</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon expense"><TrendingDown size={24} /></div>
                    <div className="kpi-info">
                        <h3>Total Gastado</h3>
                        <p>${stats.totalExpense.toLocaleString()}</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon balance"><Activity size={24} /></div>
                    <div className="kpi-info">
                        <h3>Balance</h3>
                        <p className={stats.totalIncome - stats.totalExpense >= 0 ? 'text-success' : 'text-danger'}>
                            ${(stats.totalIncome - stats.totalExpense).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="card chart-card">
                    <h3>Distribución de Gastos por Responsable</h3>
                    <div className="chart-wrapper">
                        {stats.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No hay datos de gastos</div>
                        )}
                    </div>
                </div>

                <div className="card chart-card">
                    <h3>Evolución de Gastos Mensuales</h3>
                    <div className="chart-wrapper">
                        {stats.barData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.barData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94A3B8" />
                                    <YAxis stroke="#94A3B8" />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }}
                                    />
                                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No hay datos mensuales</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
