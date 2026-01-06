import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { removeFromCart, updateQuantity, clearCart } from '../store/cartSlice';
import { orderService } from '../services/food.service';
import api from '../services/api';

const Cart = () => {
  const { items, totalAmount } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const [location, setLocation] = useState({ address: '', city: 'Addis Ababa', zipCode: '', country: 'Ethiopia', lat: 0, lng: 0 });
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'telebirr' | 'cbebirr'>('telebirr');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const deliveryFee = 50;
  const tax = totalAmount * 0.15;
  const grandTotal = totalAmount + deliveryFee + tax;

  // Get user's current GPS location
  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
        setGettingLocation(false);
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location services.');
        setGettingLocation(false);
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCheckout = async () => {
    if (!location.address || !location.city || !phone) {
      setError('Please fill all required fields');
      return;
    }

    if (!phone.match(/^(0[79]\d{8}|2519\d{8}|\+2519\d{8})$/)) {
      setError('Please enter a valid Ethiopian phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderRes = await orderService.createOrder({
        items: items.map((item) => ({ foodId: item.food._id, quantity: item.quantity })),
        location,
        payment: { method: paymentMethod },
        phone,
        notes,
      });

      const orderId = orderRes.data.order._id;

      if (paymentMethod !== 'cash') {
        setPaymentStatus('processing');
        
        const paymentRes = await api.post('/payments/initiate', {
          orderId,
          method: paymentMethod,
          phone,
        });

        if (paymentRes.data.data.success) {
          if (paymentRes.data.data.payUrl) {
            window.location.href = paymentRes.data.data.payUrl;
          } else {
            pollPaymentStatus(orderId);
          }
        } else {
          setPaymentStatus('failed');
          setError(paymentRes.data.data.message);
        }
      } else {
        dispatch(clearCart());
        navigate('/orders');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to place order');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 40;

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
          setError('Payment failed. Please try again.');
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
        setError('Payment timeout. Check your phone and try again.');
      }
    };

    checkStatus();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
        <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-6 py-3 rounded-lg">
          Browse Menu
        </button>
      </div>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Processing Payment</h2>
          <p className="text-gray-600 mb-4">
            {paymentMethod === 'mpesa' && '📱 Check your phone for M-Pesa prompt'}
            {paymentMethod === 'telebirr' && '📱 Complete payment on Telebirr'}
            {paymentMethod === 'cbebirr' && '📱 Complete payment on CBE Birr'}
          </p>
          <p className="text-sm text-gray-500">Do not close this page...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2 text-green-600">Payment Successful!</h2>
          <p className="text-gray-600">Redirecting to your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

      <div className="flex items-center justify-center mb-8">
        {['Cart', 'Delivery', 'Payment'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step > i ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-orange-500 text-white' : 'bg-gray-200'
            }`}>
              {step > i ? '✓' : i + 1}
            </div>
            <span className="ml-2 mr-4">{s}</span>
            {i < 2 && <div className="w-16 h-1 bg-gray-200 mr-4" />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {step === 1 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Your Items</h2>
              {items.map((item) => (
                <div key={item.food._id} className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center gap-4">
                    <img src={item.food.image} alt="" className="w-16 h-16 rounded object-cover" />
                    <div>
                      <h3 className="font-semibold">{item.food.name}</h3>
                      <p className="text-orange-500">{item.food.price.toFixed(2)} ETB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded">
                      <button onClick={() => dispatch(updateQuantity({ foodId: item.food._id, quantity: item.quantity - 1 }))} className="px-3 py-1">-</button>
                      <span className="px-3">{item.quantity}</span>
                      <button onClick={() => dispatch(updateQuantity({ foodId: item.food._id, quantity: item.quantity + 1 }))} className="px-3 py-1">+</button>
                    </div>
                    <span className="font-semibold w-24 text-right">{(item.food.price * item.quantity).toFixed(2)} ETB</span>
                    <button onClick={() => dispatch(removeFromCart(item.food._id))} className="text-red-500">✕</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setStep(2)} className="w-full mt-4 bg-orange-500 text-white py-3 rounded-lg font-semibold">
                Continue to Delivery
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">📍 Delivery Information</h2>
              <div className="space-y-4">
                {/* GPS Location Button */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="font-semibold text-gray-800">Share Your Location</p>
                        <p className="text-sm text-gray-500">Help delivery person find you faster</p>
                      </div>
                    </div>
                    <button
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {gettingLocation ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Getting...
                        </>
                      ) : (
                        <>📌 Get My Location</>
                      )}
                    </button>
                  </div>
                  {location.lat !== 0 && location.lng !== 0 && (
                    <div className="mt-2 p-2 bg-green-100 rounded-lg text-green-700 text-sm flex items-center gap-2">
                      <span>✅</span> Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </div>
                  )}
                  {locationError && (
                    <div className="mt-2 p-2 bg-red-100 rounded-lg text-red-700 text-sm">
                      ⚠️ {locationError}
                    </div>
                  )}
                </div>

                <input
                  placeholder="Street Address / Area *"
                  value={location.address}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3"
                />
                <select
                  value={location.city}
                  onChange={(e) => setLocation({ ...location, city: e.target.value })}
                  className="w-full border rounded-lg px-4 py-3"
                >
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Dire Dawa">Dire Dawa</option>
                  <option value="Hawassa">Hawassa</option>
                  <option value="Bahir Dar">Bahir Dar</option>
                  <option value="Adama">Adama</option>
                  <option value="Mekelle">Mekelle</option>
                  <option value="Gondar">Gondar</option>
                  <option value="Jimma">Jimma</option>
                </select>
                <input
                  placeholder="Phone Number * (e.g., 0911234567)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                />
                <textarea
                  placeholder="Delivery Notes (landmark, building, floor, etc.)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                  rows={2}
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border py-3 rounded-lg">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold">
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">💳 Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'telebirr', icon: '🟢', label: 'Telebirr', desc: 'Ethio Telecom mobile money', color: 'bg-green-500' },
                  { id: 'mpesa', icon: '🟣', label: 'M-Pesa', desc: 'Safaricom Ethiopia', color: 'bg-purple-500' },
                  { id: 'cbebirr', icon: '🔵', label: 'CBE Birr', desc: 'Commercial Bank of Ethiopia', color: 'bg-blue-600' },
                  { id: 'cash', icon: '💵', label: 'Cash on Delivery', desc: 'Pay when you receive', color: 'bg-gray-500' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id as typeof paymentMethod)}
                      className="hidden"
                    />
                    <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-white text-2xl mr-4`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                    {paymentMethod === method.id && <span className="text-orange-500 text-xl">✓</span>}
                  </label>
                ))}
              </div>

              {paymentMethod !== 'cash' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    📱 You will receive a payment prompt on your phone ({phone || 'enter phone number'})
                  </p>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 border py-3 rounded-lg">Back</button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Pay ${grandTotal.toFixed(2)} ETB`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.food._id} className="flex justify-between">
                <span>{item.quantity}x {item.food.name}</span>
                <span>{(item.food.price * item.quantity).toFixed(2)} ETB</span>
              </div>
            ))}
          </div>
          <hr className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{totalAmount.toFixed(2)} ETB</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee.toFixed(2)} ETB</span></div>
            <div className="flex justify-between"><span>VAT (15%)</span><span>{tax.toFixed(2)} ETB</span></div>
          </div>
          <hr className="my-4" />
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-orange-500">{grandTotal.toFixed(2)} ETB</span>
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
            🚗 Delivery: 30-45 mins
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
