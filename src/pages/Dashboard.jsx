import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MovementForm from '../components/MovementForm';
import Statistics from '../components/Statistics';
import Projects from '../components/Projects';
import ProjectStats from '../components/ProjectStats';
import './Dashboard.css';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('movements');

    return (
        <div className="dashboard">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="main-content">
                <header className="dashboard-header glass">
                    <h1>
                        {activeTab === 'movements' && 'Cargar Movimiento'}
                        {activeTab === 'statistics' && 'Estadísticas Gastos'}
                        {activeTab === 'projects' && 'Gestión de Proyectos'}
                        {activeTab === 'project-stats' && 'Estadísticas de Proyectos'}
                    </h1>
                </header>

                <div className="content-area">
                    {activeTab === 'movements' && <MovementForm />}
                    {activeTab === 'statistics' && <Statistics />}
                    {activeTab === 'projects' && <Projects />}
                    {activeTab === 'project-stats' && <ProjectStats />}
                </div>
            </main>
        </div>
    );
}
