import React, { useState, useEffect, useCallback } from 'react';
import { Listing } from '../types/interfaces';
import { ConfigUI } from '../config';
import { fetchNui } from '../utils/fetchNui';
import CreateListingModal from './CreateListingModal';

interface GoodsTabProps {
    listings: Listing[];
    myListings: Listing[];
    playerCid: string;
    sellerAlerts: { listingId: number; coords: any; sealDeadline: number; label: string }[];
    buyerAlerts: { listingId: number; coords: any }[];
    onRefresh: () => void;
}

function formatTimeLeft(sealDeadline: number): string {
    const diff = sealDeadline - Math.floor(Date.now() / 1000);
    if (diff <= 0) return 'Expired';
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const GoodsTab: React.FC<GoodsTabProps> = ({ listings, myListings, playerCid, sellerAlerts, buyerAlerts, onRefresh }) => {
    const [showModal, setShowModal]   = useState(false);
    const [activeView, setActiveView] = useState<'market' | 'mine'>('market');
    const [buying, setBuying]         = useState<number | null>(null);
    const [tick, setTick]             = useState(0);

    // Update countdown every second
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    function handleBuy(listingId: number) {
        setBuying(listingId);
        fetchNui<{ success: boolean; notif?: string }>('buyListing', { listingId })
            .then(res => { if (res.success) onRefresh(); })
            .finally(() => setBuying(null));
    }

    function handleRemove(listingId: number) {
        fetchNui<{ success: boolean }>('removeListing', { listingId })
            .then(res => { if (res.success) onRefresh(); });
    }

    function handleGPS(coords: any) {
        fetchNui('goodsDeliveryLocation', { coords });
    }

    const available = listings.filter(l => l.status === 'available');
    const mySales   = listings.filter(l => l.status === 'sold' && l.seller_cid === playerCid);
    const myPending = listings.filter(l => l.status === 'sold' && l.buyer_cid === playerCid);

    return (
        <div className="goods-tab">
            {/* Alert banners */}
            {sellerAlerts.map(alert => (
                <div key={alert.listingId} className="goods-alert seller-alert">
                    <i className="fa-solid fa-truck" />
                    <div className="goods-alert-text">
                        <strong>Deliver "{alert.label}"</strong>
                        <span>Seal deadline: {formatTimeLeft(alert.sealDeadline)}</span>
                    </div>
                    <button className="goods-gps-btn" onClick={() => handleGPS(alert.coords)}>
                        <i className="fa-solid fa-location-dot" /> GPS
                    </button>
                </div>
            ))}
            {buyerAlerts.map(alert => (
                <div key={alert.listingId} className="goods-alert buyer-alert">
                    <i className="fa-solid fa-box-open" />
                    <div className="goods-alert-text">
                        <strong>Your order is ready!</strong>
                        <span>Go pick up your container</span>
                    </div>
                    <button className="goods-gps-btn" onClick={() => handleGPS(alert.coords)}>
                        <i className="fa-solid fa-location-dot" /> GPS
                    </button>
                </div>
            ))}

            {/* View toggle */}
            <div className="goods-header">
                <div className="goods-tabs-toggle">
                    <button
                        className={`goods-toggle-btn ${activeView === 'market' ? 'active' : ''}`}
                        onClick={() => setActiveView('market')}
                    >Market</button>
                    <button
                        className={`goods-toggle-btn ${activeView === 'mine' ? 'active' : ''}`}
                        onClick={() => setActiveView('mine')}
                    >My Listings</button>
                </div>
                <button className="side-button goods-list-btn" onClick={() => setShowModal(true)}>
                    <i className="fa-solid fa-plus" /> List Item
                </button>
            </div>

            {activeView === 'market' && (
                <div className="goods-list">
                    {available.length === 0 && (
                        <div id="checkout-empty">No items listed yet</div>
                    )}
                    {available.map(listing => (
                        <div key={listing.id} className="goods-card">
                            <img
                                className="goods-img"
                                src={`https://cfx-nui-${ConfigUI.inventory}/html/images/${listing.image}`}
                                alt={listing.label}
                            />
                            <div className="goods-info">
                                <div className="goods-name">{listing.label}</div>
                                <div className="goods-meta">
                                    <span>{listing.quantity}x</span>
                                    <span className="goods-seller">by {listing.seller_name}</span>
                                </div>
                            </div>
                            <div className="goods-right">
                                <div className="goods-price">
                                    {ConfigUI.paymentType === 'crypto'
                                        ? `${listing.price} ${ConfigUI.acronym}`
                                        : `$${listing.price}`}
                                </div>
                                <button
                                    className={`item-add ${(buying === listing.id || listing.seller_cid === playerCid) ? 'disable-button' : ''}`}
                                    disabled={buying === listing.id || listing.seller_cid === playerCid}
                                    onClick={() => handleBuy(listing.id)}
                                >
                                    {listing.seller_cid === playerCid ? 'Your listing' : 'Buy'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeView === 'mine' && (
                <div className="goods-list">
                    {myListings.length === 0 && mySales.length === 0 && myPending.length === 0 && (
                        <div id="checkout-empty">You have no listings</div>
                    )}

                    {/* Pending sales (seller needs to deliver) */}
                    {mySales.map(listing => {
                        const alert = sellerAlerts.find(a => a.listingId === listing.id);
                        return (
                            <div key={listing.id} className="goods-card goods-card-sold">
                                <img className="goods-img" src={`https://cfx-nui-${ConfigUI.inventory}/html/images/${listing.image}`} alt={listing.label} />
                                <div className="goods-info">
                                    <div className="goods-name">{listing.label} <span className="badge-sold">SOLD</span></div>
                                    <div className="goods-meta">
                                        <span>{listing.quantity}x</span>
                                        <span>Buyer: {listing.buyer_name}</span>
                                    </div>
                                    {listing.seal_deadline && (
                                        <div className="goods-timer">⏱ {formatTimeLeft(listing.seal_deadline)}</div>
                                    )}
                                </div>
                                <div className="goods-right">
                                    <div className="goods-price">
                                        {ConfigUI.paymentType === 'crypto' ? `${listing.price} ${ConfigUI.acronym}` : `$${listing.price}`}
                                    </div>
                                    {alert && (
                                        <button className="goods-gps-btn" onClick={() => handleGPS(alert.coords)}>
                                            <i className="fa-solid fa-location-dot" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Active listings */}
                    {myListings.map(listing => (
                        <div key={listing.id} className="goods-card">
                            <img className="goods-img" src={`https://cfx-nui-${ConfigUI.inventory}/html/images/${listing.image}`} alt={listing.label} />
                            <div className="goods-info">
                                <div className="goods-name">{listing.label}</div>
                                <div className="goods-meta"><span>{listing.quantity}x</span></div>
                            </div>
                            <div className="goods-right">
                                <div className="goods-price">
                                    {ConfigUI.paymentType === 'crypto' ? `${listing.price} ${ConfigUI.acronym}` : `$${listing.price}`}
                                </div>
                                <button className="checkout-remove" onClick={() => handleRemove(listing.id)}>Remove</button>
                            </div>
                        </div>
                    ))}

                    {/* Pending purchases (buyer waiting) */}
                    {myPending.map(listing => {
                        const alert = buyerAlerts.find(a => a.listingId === listing.id);
                        return (
                            <div key={listing.id} className="goods-card goods-card-pending">
                                <img className="goods-img" src={`https://cfx-nui-${ConfigUI.inventory}/html/images/${listing.image}`} alt={listing.label} />
                                <div className="goods-info">
                                    <div className="goods-name">{listing.label} <span className="badge-pending">AWAITING</span></div>
                                    <div className="goods-meta"><span>{listing.quantity}x</span></div>
                                </div>
                                <div className="goods-right">
                                    <div className="goods-price">
                                        {ConfigUI.paymentType === 'crypto' ? `${listing.price} ${ConfigUI.acronym}` : `$${listing.price}`}
                                    </div>
                                    {alert && (
                                        <button className="goods-gps-btn" onClick={() => handleGPS(alert.coords)}>
                                            <i className="fa-solid fa-location-dot" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <CreateListingModal
                    onClose={() => setShowModal(false)}
                    onCreated={() => { setShowModal(false); onRefresh(); }}
                />
            )}
        </div>
    );
};

export default GoodsTab;
