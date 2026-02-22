import { Item } from '../types/interfaces';
import { ConfigUI } from '../config';

interface ShopItemProps {
    item: Item;
    disableAdd: boolean;
    addToCart: (item: Item) => void;
    discountPct?: number;
}

const ShopItem = ({ item, disableAdd, addToCart, discountPct = 0 }: ShopItemProps) => {
    const displayPrice = discountPct > 0 ? Math.floor(item.price * (1 - discountPct / 100)) : item.price;

    return (
        <div className="item-container">
            <div className="item-name">{item.label}</div>
            <img src={`https://cfx-nui-${ConfigUI.inventory}/html/images/${item.image}`} alt={item.label} />
            <div className="item-price">
                {discountPct > 0 && <span className="item-original-price">
                    {ConfigUI.paymentType === "crypto" ? `${item.price} ${ConfigUI.acronym}` : `$${item.price}`}
                </span>}
                {ConfigUI.paymentType === "crypto" ? `${displayPrice} ${ConfigUI.acronym}` : `$${displayPrice}`}
                {discountPct > 0 && <span className="discount-badge">-{discountPct}%</span>}
            </div>
            <div className="item-stock">Stock: {item.stock}</div>
            <button onClick={() => addToCart({ ...item, price: displayPrice })} disabled={disableAdd} className="item-add">
                Add To Cart
            </button>
        </div>
    );
};

export default ShopItem;
