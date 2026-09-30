import { useState } from 'react';
import { Menu, X, PieChart, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar({ activeTab, setActiveTab }) {
    const [isOpen, setIsOpen] = useState(false);
    const { logout } = useAuth();

    const toggleSidebar = () => setIsOpen(!isOpen);

    const menuItems = [
        { id: 'movements', label: 'Cargar Movimiento', icon: <DollarSign size={20} /> },
        { id: 'statistics', label: 'Estadísticas Gastos', icon: <PieChart size={20} /> },
        { id: 'projects', label: 'Gestión Proyectos', icon: <Menu size={20} /> },
        { id: 'project-stats', label: 'Estadísticas Proyectos', icon: <PieChart size={20} /> },
    ];

    return (
        <>
            <button className="menu-toggle glass" onClick={toggleSidebar}>
                <Menu size={24} />
            </button>

            <div className={`sidebar glass ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-title">LYNX</h2>
                    <button className="close-btn" onClick={toggleSidebar}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsOpen(false);
                            }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={logout}>
                        <span className="nav-icon"><LogOut size={20} /></span>
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
        </>
    );
}
