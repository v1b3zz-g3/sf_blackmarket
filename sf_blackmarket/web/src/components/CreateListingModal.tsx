import React, { useState } from 'react';
import { fetchNui } from '../utils/fetchNui';
import { ConfigUI } from '../config';

interface CreateListingModalProps {
    onClose: () => void;
    onCreated: () => void;
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ onClose, onCreated }) => {
    const [item, setItem]         = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice]       = useState(0);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    function handleSubmit() {
        if (!item.trim()) { setError('Item name is required'); return; }
        if (quantity < 1) { setError('Quantity must be at least 1'); return; }
        if (price < 1)    { setError('Price must be at least 1'); return; }

        setLoading(true);
        setError('');
        fetchNui<{ success: boolean; notif?: string }>('createListing', { item: item.trim().toLowerCase(), quantity, price })
            .then(res => {
                if (res.success) { onCreated(); }
                else { setError(res.notif || 'Failed to create listing'); }
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <span>List an Item</span>
                    <button className="modal-close" onClick={onClose}><i className="fa-solid fa-x" /></button>
                </div>

                <div className="modal-field">
                    <label>Item Name (internal)</label>
                    <input
                        type="text"
                        placeholder="e.g. weapon_pistol"
                        value={item}
                        onChange={e => setItem(e.target.value)}
                        className="modal-input"
                    />
                </div>

                <div className="modal-row">
                    <div className="modal-field half">
                        <label>Quantity</label>
                        <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                            className="modal-input"
                        />
                    </div>
                    <div className="modal-field half">
                        <label>Price ({ConfigUI.paymentType === 'crypto' ? ConfigUI.acronym : '$'})</label>
                        <input
                            type="number"
                            min={1}
                            value={price}
                            onChange={e => setPrice(parseInt(e.target.value) || 0)}
                            className="modal-input"
                        />
                    </div>
                </div>

                {error && <div className="modal-error">{error}</div>}

                <button
                    className={`side-button ${loading ? 'disable-button' : ''}`}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Listing...' : 'List Item'}
                </button>
            </div>
        </div>
    );
};

export default CreateListingModal;
