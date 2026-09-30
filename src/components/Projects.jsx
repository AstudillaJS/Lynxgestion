import { useState, useEffect } from 'react';
import { Plus, ListTodo, Target, Users, Calendar, ChevronRight, Save, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

export default function Projects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        objective: '',
        target_audience: '',
        progress: 0
    });
    const [stages, setStages] = useState([]);
    const [newStage, setNewStage] = useState({
        name: '',
        start_date: '',
        end_date: '',
        status: 'pending'
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStages = async (projectId) => {
        const { data, error } = await supabase
            .from('project_stages')
            .select('*')
            .eq('project_id', projectId)
            .order('start_date', { ascending: true });

        if (!error) setStages(data);
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        console.log('Attempting to create project:', formData);

        if (!user || !user.id) {
            alert('Error: No se encontró sesión de usuario. Intenta cerrar sesión y volver a entrar.');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([{
                    name: formData.name,
                    objective: formData.objective,
                    target_audience: formData.target_audience,
                    progress: formData.progress,
                    user_id: user.id
                }])
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            console.log('Project created successfully:', data);
            if (data && data[0]) {
                setProjects([data[0], ...projects]);
            } else {
                await fetchProjects(); // Backup if select somehow fails
            }

            setIsCreating(false);
            setFormData({ name: '', objective: '', target_audience: '', progress: 0 });
        } catch (error) {
            console.error('Full Error Object:', error);
            alert('Error al crear proyecto: ' + (error.message || 'Error desconocido'));
        }
    };

    const handleAddStage = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('project_stages')
                .insert([{ ...newStage, project_id: selectedProject.id }])
                .select();

            if (error) throw error;
            setStages([...stages, data[0]]);
            setNewStage({ name: '', start_date: '', end_date: '', status: 'pending' });
            updateProjectProgress(selectedProject.id);
        } catch (error) {
            alert('Error al agregar etapa: ' + error.message);
        }
    };

    const toggleStageStatus = async (stage) => {
        const newStatus = stage.status === 'done' ? 'pending' : 'done';
        const { error } = await supabase
            .from('project_stages')
            .update({ status: newStatus })
            .eq('id', stage.id);

        if (!error) {
            setStages(stages.map(s => s.id === stage.id ? { ...s, status: newStatus } : s));
            updateProjectProgress(selectedProject.id);
        }
    };

    const updateProjectProgress = async (projectId) => {
        // Simple logic: % of completed stages
        const { data: currentStages } = await supabase
            .from('project_stages')
            .select('status')
            .eq('project_id', projectId);

        if (currentStages && currentStages.length > 0) {
            const completed = currentStages.filter(s => s.status === 'done').length;
            const progress = Math.round((completed / currentStages.length) * 100);

            await supabase
                .from('projects')
                .update({ progress })
                .eq('id', projectId);

            setProjects(projects.map(p => p.id === projectId ? { ...p, progress } : p));
            if (selectedProject?.id === projectId) {
                setSelectedProject({ ...selectedProject, progress });
            }
        }
    };

    const deleteProject = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este proyecto y todas sus etapas?')) return;
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (!error) {
            setProjects(projects.filter(p => p.id !== id));
            setSelectedProject(null);
        }
    };

    if (loading) return <div className="loading">Cargando proyectos...</div>;

    return (
        <div className="projects-container fade-in">
            <div className="projects-header">
                <button
                    className={`btn ${isCreating ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => {
                        setIsCreating(!isCreating);
                        setSelectedProject(null);
                    }}
                >
                    {isCreating ? 'Cancelar' : <><Plus size={20} /> Nuevo Proyecto</>}
                </button>
            </div>

            <div className="projects-layout">
                {/* Projects List */}
                <div className="projects-list-panel glass">
                    <h3 className="panel-title"><ListTodo size={20} /> Proyectos Activos</h3>
                    <div className="project-items">
                        {projects.map(project => (
                            <div
                                key={project.id}
                                className={`project-item glass ${selectedProject?.id === project.id ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedProject(project);
                                    setIsCreating(false);
                                    fetchStages(project.id);
                                }}
                            >
                                <div className="project-info">
                                    <h4>{project.name}</h4>
                                    <div className="progress-mini">
                                        <div className="progress-bar-bg">
                                            <div className="progress-bar-fill" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                        <span>{project.progress}%</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="project-detail-panel glass">
                    {isCreating ? (
                        <form onSubmit={handleCreateProject} className="project-form">
                            <h3>Crear Nuevo Proyecto</h3>
                            <div className="form-group">
                                <label>Nombre del Proyecto</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Objetivo</label>
                                <textarea
                                    required
                                    rows="3"
                                    value={formData.objective}
                                    onChange={e => setFormData({ ...formData, objective: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Público Objetivo</label>
                                <input
                                    type="text"
                                    value={formData.target_audience}
                                    onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">
                                <Save size={20} /> Guardar Proyecto
                            </button>
                        </form>
                    ) : selectedProject ? (
                        <div className="project-details">
                            <div className="details-header">
                                <div className="header-title-group">
                                    <h2>{selectedProject.name}</h2>
                                    <div className="project-progress-main">
                                        <div className="progress-bar-container">
                                            <div
                                                className="progress-bar-fill-large"
                                                style={{ width: `${selectedProject.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-percentage">{selectedProject.progress}%</span>
                                    </div>
                                </div>
                                <button className="btn-icon text-error" onClick={() => deleteProject(selectedProject.id)}>
                                    <Trash2 size={24} />
                                </button>
                            </div>

                            <div className="metadata-grid">
                                <div className="meta-item glass">
                                    <Target size={18} />
                                    <div>
                                        <label>Objetivo</label>
                                        <p>{selectedProject.objective}</p>
                                    </div>
                                </div>
                                <div className="meta-item glass">
                                    <Users size={18} />
                                    <div>
                                        <label>Público</label>
                                        <p>{selectedProject.target_audience || 'No definido'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="stages-section">
                                <div className="section-header">
                                    <h3>Etapas del Proyecto</h3>
                                    <div className="overall-progress">{selectedProject.progress}% completado</div>
                                </div>

                                <div className="stages-list">
                                    {stages.map(stage => (
                                        <div key={stage.id} className={`stage-item glass ${stage.status === 'done' ? 'done' : ''}`}>
                                            <button
                                                className="status-toggle"
                                                onClick={() => toggleStageStatus(stage)}
                                            >
                                                {stage.status === 'done' ? <CheckCircle2 className="text-success" /> : <Clock className="text-warning" />}
                                            </button>
                                            <div className="stage-info">
                                                <h4>{stage.name}</h4>
                                                <div className="stage-dates">
                                                    <Calendar size={14} />
                                                    <span>{stage.start_date || '?'} - {stage.end_date || '?'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleAddStage} className="add-stage-form glass">
                                    <h4>Agregar Nueva Etapa</h4>
                                    <div className="form-row">
                                        <input
                                            type="text"
                                            placeholder="Nombre de la etapa"
                                            required
                                            value={newStage.name}
                                            onChange={e => setNewStage({ ...newStage, name: e.target.value })}
                                        />
                                        <div className="date-inputs">
                                            <input
                                                type="date"
                                                value={newStage.start_date}
                                                onChange={e => setNewStage({ ...newStage, start_date: e.target.value })}
                                            />
                                            <input
                                                type="date"
                                                value={newStage.end_date}
                                                onChange={e => setNewStage({ ...newStage, end_date: e.target.value })}
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary">
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <ListTodo size={48} />
                            <p>Selecciona un proyecto para ver sus detalles o crea uno nuevo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
