import { useState } from 'react';
import { Save, PlusCircle, MinusCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './MovementForm.css';

export default function MovementForm() {
    const { user } = useAuth();
    const [type, setType] = useState('expense'); // 'expense' or 'income'
    const [loading, setLoading] = useState(false);

    // Common state
    const [formData, setFormData] = useState({
        responsable: '',
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        empresa: '',
        cuenta: 'Mercado pago',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Debes iniciar sesión para guardar movimientos.');
            return;
        }

        setLoading(true);

        try {
            console.log('Attempting to save movement:', formData);
            const movementData = {
                user_id: user.id,
                type,
                amount: parseFloat(formData.monto),
                date: formData.fecha,
                description: type === 'expense' ? formData.descripcion : null,
                company: type === 'expense' ? formData.responsable : formData.empresa,
                account: type === 'income' ? formData.cuenta : null,
            };

            const { data, error } = await supabase
                .from('movements')
                .insert([movementData])
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            console.log('Movement saved:', data);
            alert('Movimiento guardado exitosamente');

            // Reset form
            setFormData({
                responsable: '',
                descripcion: '',
                monto: '',
                fecha: new Date().toISOString().split('T')[0],
                empresa: '',
                cuenta: 'Mercado pago',
            });
        } catch (error) {
            console.error('Error saving movement:', error);
            alert('Error al guardar: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="movement-form-container fade-in">
            <div className="card form-card">
                <div className="type-toggle">
                    <button
                        type="button"
                        className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
                        onClick={() => setType('expense')}
                    >
                        <MinusCircle size={18} />
                        Cargar Gasto
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
                        onClick={() => setType('income')}
                    >
                        <PlusCircle size={18} />
                        Cargar Ingreso
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form-content">
                    {type === 'expense' ? (
                        <>
                            <div className="form-group">
                                <label>Responsable del Gasto</label>
                                <input
                                    type="text"
                                    name="responsable"
                                    value={formData.responsable}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej. Juan Perez"
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <input
                                    type="text"
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej. Compra de insumos"
                                />
                            </div>
                            <div className="row">
                                <div className="form-group">
                                    <label>Monto</label>
                                    <input
                                        type="number"
                                        name="monto"
                                        value={formData.monto}
                                        onChange={handleChange}
                                        required
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Empresa Pagadora</label>
                                <input
                                    type="text"
                                    name="empresa"
                                    value={formData.empresa}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej. Cliente S.A."
                                />
                            </div>
                            <div className="row">
                                <div className="form-group">
                                    <label>Monto</label>
                                    <input
                                        type="number"
                                        name="monto"
                                        value={formData.monto}
                                        onChange={handleChange}
                                        required
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Cuenta de Destino</label>
                                <select name="cuenta" value={formData.cuenta} onChange={handleChange}>
                                    <option value="Personal pay">Personal Pay</option>
                                    <option value="Mercado pago">Mercado Pago</option>
                                    <option value="Cuenta personal">Cuenta Personal</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        <button type="submit" className="btn-submit" disabled={loading}>
                            <Save size={20} />
                            {loading ? 'Guardando...' : 'Guardar Movimiento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
