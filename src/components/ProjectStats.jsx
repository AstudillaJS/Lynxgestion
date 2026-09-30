import { useState, useEffect } from 'react';
import { BarChart as BarChartIcon, LayoutGrid, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../supabaseClient';
import './ProjectStats.css';

export default function ProjectStats() {
    const [stats, setStats] = useState({ projects: [], stages: [] });
    const [loading, setLoading] = useState(true);
    const [filterProject, setFilterProject] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: projects } = await supabase.from('projects').select('*').order('progress', { ascending: false });
            const { data: stages } = await supabase.from('project_stages').select('*').order('start_date', { ascending: true });
            setStats({ projects: projects || [], stages: stages || [] });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTimelineData = () => {
        if (filterProject === 'all') return [];
        return stats.stages.filter(s => s.project_id === filterProject);
    };

    const currentTimeline = getTimelineData();

    if (loading) return <div className="loading">Cargando estadísticas...</div>;

    return (
        <div className="stats-container fade-in">
            <div className="stats-grid">
                {/* Funnel Chart - Progress of all projects */}
                <div className="card chart-card glass">
                    <div className="card-header">
                        <h3><BarChartIcon size={20} /> Avance de Proyectos (%)</h3>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.projects} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    stroke="#888"
                                    fontSize={12}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#1a1f2e', border: '1px solid #30363d', borderRadius: '8px' }}
                                />
                                <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={20}>
                                    {stats.projects.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(${200 + index * 20}, 70%, 50%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Timeline / Gantt View */}
                <div className="card gantt-card glass">
                    <div className="card-header">
                        <h3><Calendar size={20} /> Cronograma de Etapas</h3>
                        <div className="filter-group">
                            <Filter size={16} />
                            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                                <option value="all">Seleccionar Proyecto...</option>
                                {stats.projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="gantt-wrapper">
                        {filterProject === 'all' ? (
                            <div className="empty-chart">
                                <LayoutGrid size={48} />
                                <p>Selecciona un proyecto para ver su cronograma</p>
                            </div>
                        ) : (
                            <div className="timeline-view">
                                {currentTimeline.length === 0 ? (
                                    <p>Este proyecto no tiene etapas definidas.</p>
                                ) : (
                                    <div className="timeline-grid">
                                        {currentTimeline.map(stage => (
                                            <div key={stage.id} className="timeline-row">
                                                <div className="timeline-info">
                                                    <span className="stage-name">{stage.name}</span>
                                                    <span className="stage-status">{stage.status}</span>
                                                </div>
                                                <div className="timeline-bar-container">
                                                    <div className="date-labels">
                                                        <span>{stage.start_date}</span>
                                                        <span>{stage.end_date}</span>
                                                    </div>
                                                    <div className={`timeline-bar ${stage.status}`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Project List Table */}
            <div className="card table-card glass">
                <h3>Resumen Ejecutivo</h3>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Proyecto</th>
                                <th>Público</th>
                                <th>Etapas</th>
                                <th>Avance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.projects.map(p => {
                                const pStages = stats.stages.filter(s => s.project_id === p.id);
                                return (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{p.target_audience || '-'}</td>
                                        <td>{pStages.length}</td>
                                        <td>
                                            <div className="progress-cell">
                                                <div className="bar-bg">
                                                    <div className="bar-fill" style={{ width: `${p.progress}%` }}></div>
                                                </div>
                                                {p.progress}%
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
