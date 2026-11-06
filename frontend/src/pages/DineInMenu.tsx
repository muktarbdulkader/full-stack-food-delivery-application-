import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { qrDiningService } from '../services/qr.service';
import type { DiningFood, QRScanResponse } from '../services/qr.service';

interface CartItem {
  food: DiningFood;
  selectedPortion?: string;
  selectedExtras: { name: string; price: number }[];
  instructions: string;
  quantity: number;
  itemTotal: number;
}

const DineInMenu = () => {
  const { qrToken } = useParams<{ qrToken: string }>();

  const [scanData, setScanData] = useState<QRScanResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Menu navigation & filtering
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<DiningFood[]>([]);

  // Item customization modal
  const [selectedFood, setSelectedFood] = useState<DiningFood | null>(null);
  const [chosenPortion, setChosenPortion] = useState<string>('');
  const [chosenExtras, setChosenExtras] = useState<{ name: string; price: number }[]>([]);
  const [itemInstructions, setItemInstructions] = useState('');
  const [itemQty, setItemQty] = useState(1);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`cart_${qrToken}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Waiter & Bill modals
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [waiterRequestType, setWaiterRequestType] = useState('waiter');
  const [waiterNote, setWaiterNote] = useState('');
  const [waiterAlertMessage, setWaiterAlertMessage] = useState('');
  const [waiterSubmitting, setWaiterSubmitting] = useState(false);

  const [showBillModal, setShowBillModal] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [billLoading, setBillLoading] = useState(false);
  const [billRequestedMsg, setBillRequestedMsg] = useState('');

  // Active Placed Order status
  const [lastPlacedOrder, setLastPlacedOrder] = useState<any>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Load Scan Data
  useEffect(() => {
    if (!qrToken) return;

    const guestToken = localStorage.getItem(`guest_token_${qrToken}`) || undefined;

    qrDiningService
      .resolveScan(qrToken, guestToken)
      .then((res) => {
        setScanData(res.data);
        setFilteredFoods(res.data.menu.foods);
        if (res.data.guest?.token) {
          localStorage.setItem(`guest_token_${qrToken}`, res.data.guest.token);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not verify table QR code.');
      })
      .finally(() => setLoading(false));
  }, [qrToken]);

  // Save Cart to LocalStorage
  useEffect(() => {
    if (qrToken) {
      localStorage.setItem(`cart_${qrToken}`, JSON.stringify(cart));
    }
  }, [cart, qrToken]);

  // Filter Foods
  useEffect(() => {
    if (!scanData) return;
    let list = [...scanData.menu.foods];

    if (selectedCategory !== 'all') {
      list = list.filter((f) => f.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }

    setFilteredFoods(list);
  }, [selectedCategory, searchQuery, scanData]);

  // Open Customization Modal
  const handleOpenFoodModal = (food: DiningFood) => {
    setSelectedFood(food);
    const defaultPortion = food.portions?.find((p) => p.isDefault)?.name || food.portions?.[0]?.name || '';
    setChosenPortion(defaultPortion);
    setChosenExtras([]);
    setItemInstructions('');
    setItemQty(1);
  };

  // Calculate live single item price
  const calculateModalItemPrice = () => {
    if (!selectedFood) return 0;
    let base = selectedFood.price;
    if (chosenPortion && selectedFood.portions) {
      const p = selectedFood.portions.find((port) => port.name === chosenPortion);
      if (p) base = p.price;
    }
    const extrasTotal = chosenExtras.reduce((sum, e) => sum + e.price, 0);
    return (base + extrasTotal) * itemQty;
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedFood) return;
    const itemTotal = calculateModalItemPrice();

    const newItem: CartItem = {
      food: selectedFood,
      selectedPortion: chosenPortion,
      selectedExtras: [...chosenExtras],
      instructions: itemInstructions,
      quantity: itemQty,
      itemTotal,
    };

    setCart((prev) => [...prev, newItem]);
    setSelectedFood(null);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, it) => sum + it.itemTotal, 0);
  const taxRate = scanData?.restaurant.taxRate ?? 0.15;
  const serviceChargeRate = scanData?.restaurant.serviceChargeRate ?? 0.05;
  const cartTax = Math.round(cartSubtotal * taxRate);
  const cartServiceCharge = Math.round(cartSubtotal * serviceChargeRate);
  const cartGrandTotal = cartSubtotal + cartTax + cartServiceCharge;

  // Place Order
  const handlePlaceOrder = async () => {
    if (!qrToken || cart.length === 0) return;
    setPlacingOrder(true);
    setError('');

    const guestToken = localStorage.getItem(`guest_token_${qrToken}`) || undefined;

    try {
      const payload = {
        qrToken,
        guestToken,
        items: cart.map((it) => ({
          foodId: it.food._id,
          quantity: it.quantity,
          selectedPortion: it.selectedPortion,
          selectedExtras: it.selectedExtras,
          instructions: it.instructions,
        })),
      };

      const res = await qrDiningService.placeOrder(payload);
      setLastPlacedOrder(res.data.order);
      setCart([]);
      setShowCartDrawer(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit order. Please alert your waiter.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Call Waiter
  const handleCallWaiter = async () => {
    if (!qrToken) return;
    setWaiterSubmitting(true);
    try {
      const res = await qrDiningService.callWaiter(qrToken, waiterRequestType, waiterNote);
      setWaiterAlertMessage(res.message);
      setTimeout(() => {
        setShowWaiterModal(false);
        setWaiterAlertMessage('');
        setWaiterNote('');
      }, 2500);
    } catch (err: any) {
      setWaiterAlertMessage(err.response?.data?.message || 'Failed to call staff.');
    } finally {
      setWaiterSubmitting(false);
    }
  };

  // Open Bill View
  const handleOpenBill = async () => {
    if (!qrToken) return;
    setShowBillModal(true);
    setBillLoading(true);
    setBillRequestedMsg('');
    try {
      const res = await qrDiningService.getTableBill(qrToken);
      setBillData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setBillLoading(false);
    }
  };

  // Request Final Bill
  const handleRequestBill = async (method: string) => {
    if (!qrToken) return;
    try {
      const res = await qrDiningService.requestBill(qrToken, method);
      setBillRequestedMsg(res.message);
    } catch (err: any) {
      setBillRequestedMsg(err.response?.data?.message || 'Could not request invoice.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4" />
        <h2 className="font-display font-bold text-xl text-slate-800">Connecting to Your Table...</h2>
        <p className="text-slate-400 text-xs mt-1">Verifying QR identity & loading dining menu</p>
      </div>
    );
  }

  if (error || !scanData) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-red-100 shadow-xl">
          <span className="text-5xl block mb-3">⚠️</span>
          <h2 className="font-display font-bold text-xl text-slate-900 mb-2">QR Code Notice</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Table not found'}</p>
          <Link to="/" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold">
            Go to FoodHub Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-32">
      
      {/* Table Identification Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xl shadow-md shadow-orange-500/20">
              🍽️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-slate-900 text-base">
                  Table {scanData.table.number}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-extrabold text-[10px] uppercase">
                  {scanData.table.diningArea}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {scanData.restaurant.name} • {scanData.branch.name}
              </p>
            </div>
          </div>

          {/* Quick Service Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWaiterModal(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>🔔</span>
              <span className="hidden sm:inline">Call Waiter</span>
            </button>
            <button
              onClick={handleOpenBill}
              className="px-3 py-1.5 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>🧾</span>
              <span>Table Bill</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 pt-5">
        
        {/* Placed Order Alert (if order recently submitted) */}
        {lastPlacedOrder && (
          <div className="mb-6 p-4.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl shadow-lg flex items-center justify-between animate-scale-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👨‍🍳</span>
              <div>
                <p className="font-display font-black text-sm">
                  Order #{lastPlacedOrder.orderNumber} Sizzling!
                </p>
                <p className="text-xs text-white/90">
                  Kitchen is cooking your food for Table {scanData.table.number}.
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastPlacedOrder(null)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food, drinks, desserts..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white shadow-orange-500/25'
                : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
            }`}
          >
            All Items
          </button>
          {scanData.menu.categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-orange-500 text-white shadow-orange-500/25'
                  : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Food Menu List */}
        <div className="space-y-4">
          {filteredFoods.map((food) => (
            <div
              key={food._id}
              onClick={() => handleOpenFoodModal(food)}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer flex gap-4 items-center"
            >
              <img
                src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                alt={food.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover bg-orange-50 flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-slate-900 text-base truncate">
                    {food.name}
                  </h3>
                  {food.isFasting && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                      ጾም
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                  {food.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-slate-900 text-base">
                    {food.price.toFixed(0)} <span className="text-xs text-orange-600 font-bold">ETB</span>
                  </span>

                  <span className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 transition-colors">
                    Customize +
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40">
          <div
            onClick={() => setShowCartDrawer(true)}
            className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 text-white rounded-2xl p-4 shadow-xl shadow-orange-500/30 flex items-center justify-between cursor-pointer hover:scale-[1.02] active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                {cart.reduce((s, it) => s + it.quantity, 0)}
              </div>
              <div>
                <p className="font-display font-bold text-sm">View Table Order</p>
                <p className="text-[11px] text-white/80">{cart.length} item(s) selected</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg">{cartGrandTotal.toFixed(0)} ETB</span>
              <span className="text-xs bg-white text-orange-600 px-3 py-1.5 rounded-xl font-black">
                Review →
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FOOD CUSTOMIZATION MODAL */}
      {/* ========================================================= */}
      {selectedFood && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-up"
          onClick={() => setSelectedFood(null)}
        >
          <div
            className="bg-white rounded-t-[2rem] sm:rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                  {selectedFood.category}
                </span>
                <h2 className="font-display font-bold text-2xl text-slate-900">{selectedFood.name}</h2>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <img
              src={selectedFood.image}
              alt=""
              className="w-full h-44 rounded-2xl object-cover mb-4"
            />
            <p className="text-xs text-slate-500 leading-relaxed mb-5">{selectedFood.description}</p>

            {/* Portions / Sizing */}
            {selectedFood.portions && selectedFood.portions.length > 0 && (
              <div className="mb-5">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Choose Portion / Size
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFood.portions.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setChosenPortion(p.name)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        chosenPortion === p.name
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>{p.name}</span>
                        <span>{p.price.toFixed(0)} ETB</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Extras */}
            {selectedFood.extras && selectedFood.extras.length > 0 && (
              <div className="mb-5">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Optional Add-ons & Extras
                </h4>
                <div className="space-y-2">
                  {selectedFood.extras.map((extra) => {
                    const isChecked = chosenExtras.some((e) => e.name === extra.name);
                    return (
                      <label
                        key={extra.name}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer text-xs font-medium transition-colors ${
                          isChecked ? 'border-orange-400 bg-orange-50/60' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setChosenExtras([...chosenExtras, extra]);
                              } else {
                                setChosenExtras(chosenExtras.filter((ex) => ex.name !== extra.name));
                              }
                            }}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span>{extra.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">+{extra.price.toFixed(0)} ETB</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="mb-6">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                Special Kitchen Instructions
              </h4>
              <input
                type="text"
                value={itemInstructions}
                onChange={(e) => setItemInstructions(e.target.value)}
                placeholder="e.g. No onions, less oil, extra hot awaze..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Quantity Stepper & Add Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  className="w-8 h-8 rounded-lg bg-white font-black text-sm flex items-center justify-center text-slate-700"
                >
                  –
                </button>
                <span className="px-3 text-xs font-bold">{itemQty}</span>
                <button
                  onClick={() => setItemQty(itemQty + 1)}
                  className="w-8 h-8 rounded-lg bg-white font-black text-sm flex items-center justify-center text-slate-700"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-xl font-display font-bold text-sm shadow-md"
              >
                Add • {calculateModalItemPrice().toFixed(0)} ETB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CART DRAWER */}
      {/* ========================================================= */}
      {showCartDrawer && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-up"
          onClick={() => setShowCartDrawer(false)}
        >
          <div
            className="bg-white rounded-t-[2rem] sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900">Table Order Cart</h3>
                  <p className="text-xs text-slate-400">Table #{scanData.table.number}</p>
                </div>
                <button
                  onClick={() => setShowCartDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-slate-900 text-sm">{item.food.name}</p>
                      {item.selectedPortion && (
                        <p className="text-[11px] text-slate-500">Size: {item.selectedPortion}</p>
                      )}
                      {item.selectedExtras.length > 0 && (
                        <p className="text-[10px] text-slate-400">
                          Extras: {item.selectedExtras.map((e) => e.name).join(', ')}
                        </p>
                      )}
                      {item.instructions && (
                        <p className="text-[10px] text-orange-600 italic">"{item.instructions}"</p>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-display font-bold text-slate-900 text-sm">
                        {item.itemTotal.toFixed(0)} ETB
                      </span>
                      <button
                        onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                        className="text-xs text-red-500 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Receipt Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500 mt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-700">{cartSubtotal.toFixed(0)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%)</span>
                  <span className="font-bold text-slate-700">{cartTax.toFixed(0)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge (5%)</span>
                  <span className="font-bold text-slate-700">{cartServiceCharge.toFixed(0)} ETB</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-lg pt-2 border-t border-slate-200">
                  <span>Total Due</span>
                  <span className="text-orange-600">{cartGrandTotal.toFixed(0)} ETB</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || cart.length === 0}
              className="w-full mt-6 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-2xl font-display font-bold text-base shadow-lg disabled:opacity-50"
            >
              {placingOrder ? 'Sending to Kitchen...' : `Confirm Dine-in Order • ${cartGrandTotal.toFixed(0)} ETB`}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CALL WAITER MODAL */}
      {/* ========================================================= */}
      {showWaiterModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up"
          onClick={() => setShowWaiterModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-4xl block mb-2">🔔</span>
            <h3 className="font-display font-bold text-xl text-slate-900 mb-1">Call Waiter</h3>
            <p className="text-xs text-slate-500 mb-4">Table #{scanData.table.number} Staff Assistance</p>

            {waiterAlertMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold mb-4">
                {waiterAlertMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'waiter', label: 'Call Waiter', icon: '🙋' },
                { id: 'water', label: 'Water Refill', icon: '💧' },
                { id: 'cutlery', label: 'Injera / Cutlery', icon: '🍴' },
                { id: 'cleaning', label: 'Clean Table', icon: '🧼' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setWaiterRequestType(opt.id)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    waiterRequestType === opt.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-lg block mb-1">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              value={waiterNote}
              onChange={(e) => setWaiterNote(e.target.value)}
              placeholder="Add optional note..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowWaiterModal(false)}
                className="flex-1 py-2.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCallWaiter}
                disabled={waiterSubmitting}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold"
              >
                {waiterSubmitting ? 'Calling...' : 'Alert Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TABLE BILL MODAL */}
      {/* ========================================================= */}
      {showBillModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up"
          onClick={() => setShowBillModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-display font-bold text-xl text-slate-900">Table #{scanData.table.number} Bill</h3>
                <p className="text-xs text-slate-400">Consolidated Dining Orders</p>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {billRequestedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold mb-4">
                {billRequestedMsg}
              </div>
            )}

            {billLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading invoice...</div>
            ) : billData && billData.totalAmount > 0 ? (
              <div>
                <div className="space-y-2 mb-4 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold">{billData.subtotal} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%)</span>
                    <span className="font-bold">{billData.tax} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge</span>
                    <span className="font-bold">{billData.serviceCharge} ETB</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Bill</span>
                    <span className="text-orange-600">{billData.totalAmount} ETB</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Request Payment Via:
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['Cash to Waiter', 'Telebirr', 'CBE Birr', 'M-Pesa'].map((meth) => (
                    <button
                      key={meth}
                      onClick={() => handleRequestBill(meth)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50 text-xs font-bold text-slate-700 transition-colors"
                    >
                      {meth}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No orders placed yet for this table.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default DineInMenu;
