import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import type { RootState } from '../store/store';
import { removeFromCart, updateQuantity, clearCart } from '../store/cartSlice';
import { orderService } from '../services/food.service';
import api from '../services/api';

const Cart = () => {
  const { items, totalAmount } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const [location, setLocation] = useState({
    address: '',
    city: 'Addis Ababa',
    zipCode: '',
    country: 'Ethiopia',
    lat: 0,
    lng: 0,
  });
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'mpesa' | 'cbebirr' | 'cash'>('telebirr');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState('');

  const deliveryFee = 50;
  const tax = totalAmount * 0.15;
  const grandTotal = totalAmount + deliveryFee + tax;

  // Browser Geolocation
  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError('');
    setLocationSuccess(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        setGettingLocation(false);
        setLocationSuccess(true);
      },
      (err) => {
        setLocationError('Unable to retrieve location. Please type your street address.');
        setGettingLocation(false);
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckout = async () => {
    if (!location.address.trim()) {
      setError('Please provide your street address or sub-city area.');
      setStep(2);
      return;
    }

    if (!phone.trim()) {
      setError('Please enter your Ethiopian contact phone number.');
      setStep(2);
      return;
    }

    // Ethiopian Phone validation: 09..., 07..., 2519..., +2519...
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone.match(/^(0[79]\d{8}|251[79]\d{8}|\+251[79]\d{8})$/)) {
      setError('Please enter a valid Ethiopian phone number (e.g. 0911234567 or 0712345678).');
      setStep(2);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderRes = await orderService.createOrder({
        items: items.map((item) => ({ foodId: item.food._id, quantity: item.quantity })),
        location,
        payment: { method: paymentMethod },
        phone: cleanPhone,
        notes,
      });

      const orderId = orderRes.data.order._id;

      if (paymentMethod !== 'cash') {
        setPaymentStatus('processing');

        const paymentRes = await api.post('/payments/initiate', {
          orderId,
          method: paymentMethod,
          phone: cleanPhone,
        });

        if (paymentRes.data.data.success) {
          if (paymentRes.data.data.payUrl) {
            window.location.href = paymentRes.data.data.payUrl;
          } else {
            pollPaymentStatus(orderId);
          }
        } else {
          setPaymentStatus('failed');
          setError(paymentRes.data.data.message || 'Payment initiation failed.');
        }
      } else {
        dispatch(clearCart());
        navigate('/orders');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Failed to place order. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/payments/status/${orderId}`);
        if (res.data.data.paymentStatus === 'paid') {
          setPaymentStatus('success');
          dispatch(clearCart());
          setTimeout(() => navigate('/orders'), 2000);
          return;
        }
        if (res.data.data.paymentStatus === 'failed') {
          setPaymentStatus('failed');
          setError('Payment declined or failed. Please try again.');
          return;
        }
      } catch (e) {
        console.error(e);
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 3000);
      } else {
        setPaymentStatus('failed');
        setError('Payment verification timed out. If money was deducted, our team will confirm your order.');
      }
    };

    checkStatus();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-12 text-center border border-orange-100 shadow-xl shadow-orange-500/5">
          <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-5xl mx-auto mb-6">
            🛒
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-800 mb-2">
            Your Cart is Empty
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Looks like you haven't added any delicious Ethiopian dishes or meals to your cart yet.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-2xl font-display font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-105 transition-all"
          >
            <span>Browse Full Menu</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Payment Processing Overlay */}
      {paymentStatus === 'processing' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-orange-100 animate-scale-in">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              Waiting for Confirmation
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {paymentMethod === 'telebirr' && '📱 Enter your Telebirr PIN on your phone'}
              {paymentMethod === 'mpesa' && '📱 Enter your M-Pesa PIN on your Safaricom phone'}
              {paymentMethod === 'cbebirr' && '📱 Confirm payment on your CBE Birr app'}
            </p>
            <p className="text-xs text-slate-400 font-semibold">Please keep this window open...</p>
          </div>
        </div>
      )}

      {/* Payment Success Overlay */}
      {paymentStatus === 'success' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-emerald-100 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-emerald-600 animate-bounce">
              ✓
            </div>
            <h3 className="font-display font-bold text-2xl text-emerald-600 mb-2">
              Payment Confirmed!
            </h3>
            <p className="text-sm text-slate-600">Your order has been sent to the kitchen. Redirecting to tracking...</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        
        {/* Title & Stepper Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 mb-2">
            Checkout & Order Review
          </h1>
          <p className="text-slate-500 text-sm">Review your selected items and choose delivery & payment details</p>
        </div>

        {/* 3-Step Indicator Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/60 shadow-sm mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { stepNum: 1, label: 'Cart Items', icon: '🛒' },
              { stepNum: 2, label: 'Delivery Address', icon: '📍' },
              { stepNum: 3, label: 'Ethiopian Payment', icon: '💳' },
            ].map((s, idx) => {
              const isPassed = step > s.stepNum;
              const isCurrent = step === s.stepNum;
              return (
                <div key={s.stepNum} className="flex items-center flex-1 last:flex-none">
                  <div
                    onClick={() => {
                      if (step > s.stepNum) setStep(s.stepNum as 1 | 2 | 3);
                    }}
                    className={`flex items-center gap-2 cursor-pointer transition-all ${
                      isCurrent
                        ? 'text-orange-600 font-bold'
                        : isPassed
                        ? 'text-emerald-600 font-bold'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                        isCurrent
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-105'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? '✓' : s.stepNum}
                    </div>
                    <span className="hidden sm:inline text-xs sm:text-sm">{s.label}</span>
                  </div>

                  {idx < 2 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 sm:mx-4 rounded transition-colors ${
                        step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3.5 rounded-2xl text-sm font-medium mb-6 flex items-center gap-2 animate-fade-in-up">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Steps 1, 2, or 3) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* STEP 1: CART REVIEW */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm animate-fade-in-up">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <h2 className="font-display font-bold text-xl text-slate-900">Your Selected Dishes</h2>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {items.length} {items.length === 1 ? 'Dish' : 'Dishes'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.food._id} className="py-4.5 flex items-center gap-4">
                      <img
                        src={item.food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                        alt={item.food.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-orange-50 border border-slate-100 flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base truncate">
                          {item.food.name}
                        </h3>
                        <p className="text-xs text-orange-600 font-bold mb-2">
                          {item.food.price.toFixed(0)} ETB
                        </p>

                        {/* Quantity Stepper */}
                        <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                          <button
                            onClick={() =>
                              dispatch(updateQuantity({ foodId: item.food._id, quantity: item.quantity - 1 }))
                            }
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shadow-xs transition-colors"
                          >
                            –
                          </button>
                          <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() =>
                              dispatch(updateQuantity({ foodId: item.food._id, quantity: item.quantity + 1 }))
                            }
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shadow-xs transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="font-display font-black text-slate-900 text-base">
                          {(item.food.price * item.quantity).toFixed(0)} <span className="text-xs text-slate-400 font-normal">ETB</span>
                        </p>
                        <button
                          onClick={() => dispatch(removeFromCart(item.food._id))}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex justify-between items-center">
                  <Link to="/menu" className="text-xs font-bold text-orange-600 hover:underline">
                    ← Add more dishes
                  </Link>
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-2xl font-display font-bold text-sm shadow-md shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Proceed to Delivery</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DELIVERY & GPS */}
            {step === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm animate-fade-in-up">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <h2 className="font-display font-bold text-xl text-slate-900">📍 Delivery Information</h2>
                  <span className="text-xs font-bold text-slate-400">Step 2 of 3</span>
                </div>

                <div className="space-y-5">
                  {/* GPS Locator Banner */}
                  <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-4.5 rounded-2xl border border-orange-200/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🧭</span>
                        <div>
                          <p className="font-display font-bold text-slate-900 text-sm">Pin Exact Location</p>
                          <p className="text-xs text-slate-500">Share GPS coordinates so our driver navigates directly to you</p>
                        </div>
                      </div>
                      <button
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {gettingLocation ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Locating...</span>
                          </>
                        ) : (
                          <>
                            <span>📍 Use My GPS</span>
                          </>
                        )}
                      </button>
                    </div>

                    {locationSuccess && (
                      <div className="mt-3 p-2.5 bg-emerald-100/80 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <span>✓</span> Coordinates captured: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                      </div>
                    )}
                    {locationError && (
                      <div className="mt-3 p-2.5 bg-red-100/80 rounded-xl text-red-700 text-xs font-medium">
                        ⚠️ {locationError}
                      </div>
                    )}
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Specific Address / Sub-City Area *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bole Medhanialem, Behind Edna Mall, Apt 4B"
                      value={location.address}
                      onChange={(e) => setLocation({ ...location, address: e.target.value })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* City Selector */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        City *
                      </label>
                      <select
                        value={location.city}
                        onChange={(e) => setLocation({ ...location, city: e.target.value })}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      >
                        <option value="Addis Ababa">Addis Ababa (አዲስ አበባ)</option>
                        <option value="Hawassa">Hawassa (ሀዋሳ)</option>
                        <option value="Adama">Adama (አዳማ)</option>
                        <option value="Dire Dawa">Dire Dawa (ድሬዳዋ)</option>
                        <option value="Bahir Dar">Bahir Dar (ባሕር ዳር)</option>
                        <option value="Gondar">Gondar (ጎንደር)</option>
                      </select>
                    </div>

                    {/* Ethiopian Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Ethiopian Contact Phone *
                      </label>
                      <input
                        type="tel"
                        placeholder="0911 234 567 or 07..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Delivery Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Kitchen / Driver Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Ring the bell twice, extra mitmita / awaze on the side..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl font-bold text-xs text-slate-600 transition-colors"
                  >
                    ← Back to Cart
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-8 py-3.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-2xl font-display font-bold text-sm shadow-md shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Choose Payment</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            {step === 3 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm animate-fade-in-up">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <h2 className="font-display font-bold text-xl text-slate-900">💳 Select Payment Method</h2>
                  <span className="text-xs font-bold text-slate-400">Step 3 of 3</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      id: 'telebirr',
                      name: 'Telebirr',
                      provider: 'Ethio Telecom',
                      badge: 'Instant C2B',
                      color: 'border-emerald-500 bg-emerald-50/50',
                      indicator: 'bg-emerald-500',
                      icon: '📱',
                    },
                    {
                      id: 'mpesa',
                      name: 'M-Pesa Ethiopia',
                      provider: 'Safaricom Ethiopia',
                      badge: 'Fast & Secure',
                      color: 'border-red-500 bg-red-50/50',
                      indicator: 'bg-red-500',
                      icon: '🔴',
                    },
                    {
                      id: 'cbebirr',
                      name: 'CBE Birr',
                      provider: 'Commercial Bank of Ethiopia',
                      badge: 'Bank Transfer',
                      color: 'border-sky-500 bg-sky-50/50',
                      indicator: 'bg-sky-500',
                      icon: '🏦',
                    },
                    {
                      id: 'cash',
                      name: 'Cash on Delivery',
                      provider: 'Pay Driver Directly',
                      badge: 'Zero Risk',
                      color: 'border-amber-500 bg-amber-50/50',
                      indicator: 'bg-amber-500',
                      icon: '💵',
                    },
                  ].map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                        className={`p-4.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          isSelected
                            ? `${method.color} shadow-sm scale-[1.02]`
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-2xl">{method.icon}</span>
                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <span className="text-xs">✓</span>}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                            {method.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">{method.provider}</p>
                          <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                            {method.badge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {paymentMethod !== 'cash' ? (
                  <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl text-xs text-orange-800 leading-relaxed">
                    🔔 <strong>Notice:</strong> After clicking "Place Order", a payment prompt will be dispatched to your phone (<strong className="font-mono">{phone || 'provided phone'}</strong>). Confirm with your PIN to authorize.
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 leading-relaxed">
                    💵 <strong>Cash on Delivery:</strong> Please prepare exact cash of <strong className="text-slate-900">{grandTotal.toFixed(0)} ETB</strong> for the delivery driver upon arrival.
                  </div>
                )}

                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl font-bold text-xs text-slate-600 transition-colors"
                  >
                    ← Back to Address
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-2xl font-display font-bold text-base shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Place Order • {grandTotal.toFixed(0)} ETB</span>
                        <span>🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/70 shadow-xl shadow-orange-500/5">
              <h3 className="font-display font-bold text-lg text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Order Receipt Summary
              </h3>

              <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.food._id} className="flex justify-between text-xs text-slate-600">
                    <span className="truncate pr-2 font-medium">
                      {item.quantity}× {item.food.name}
                    </span>
                    <span className="font-bold text-slate-800 flex-shrink-0">
                      {(item.food.price * item.quantity).toFixed(0)} ETB
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-700">{totalAmount.toFixed(0)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Delivery (Addis)</span>
                  <span className="font-bold text-slate-700">{deliveryFee.toFixed(0)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%)</span>
                  <span className="font-bold text-slate-700">{tax.toFixed(0)} ETB</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="font-display font-black text-xl text-slate-900 block">Total Due</span>
                  <span className="text-[10px] text-slate-400">Includes all taxes and delivery</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-black text-3xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {grandTotal.toFixed(0)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-1">ETB</span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                <span>🛡️</span>
                <span>Protected by FoodHub 100% Satisfaction Guarantee</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Cart;
