import { useEffect, useState } from 'react';
import { orderService } from '../services/food.service';
import type { Order } from '../services/food.service';

const statusConfig: Record<string, { color: string; bgColor: string; icon: string; label: string; description: string }> = {
  pending: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '⏳', label: 'Pending', description: 'Waiting for restaurant confirmation' },
  confirmed: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '✅', label: 'Confirmed', description: 'Restaurant accepted your order' },
  preparing: { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '👨‍🍳', label: 'Preparing', description: 'Chef is cooking your food' },
  out_for_delivery: { color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: '🚗', label: 'On the Way', description: 'Driver is heading to you' },
  delivered: { color: 'text-green-600', bgColor: 'bg-green-100', icon: '🎉', label: 'Delivered', description: 'Enjoy your meal!' },
  cancelled: { color: 'text-red-600', bgColor: 'bg-red-100', icon: '❌', label: 'Cancelled', description: 'Order was cancelled' },
};

const statusSteps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getMyOrders();
      setOrders(response.data.orders);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📦 My Orders</h1>
        <button onClick={fetchOrders} className="px-4 py-2 bg-orange-100 text-orange-600 rounded-xl font-medium hover:bg-orange-200 transition flex items-center gap-2">
          🔄 Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="text-7xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Start ordering delicious food!</p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold">Browse Menu →</a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const isActive = !['delivered', 'cancelled'].includes(order.status);
            const currentStepIndex = statusSteps.indexOf(order.status);
            
            return (
              <div key={order._id} className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition ${isActive ? 'ring-2 ring-orange-200' : ''}`}>
                {/* Active Order Banner */}
                {isActive && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 flex items-center justify-between">
                    <span className="text-white font-medium flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Order in Progress
                    </span>
                    <span className={`px-3 py-1 bg-white/20 rounded-full text-white text-sm`}>{status.icon} {status.label}</span>
                  </div>
                )}

                <div className="p-6">
                  {/* Order ID and Date */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-bold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {!isActive && (
                      <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${status.bgColor} ${status.color}`}>{status.icon} {status.label}</span>
                    )}
                  </div>

                  {/* Progress Tracker - Show for active orders */}
                  {order.status !== 'cancelled' && (
                    <div className="mb-6 py-4 px-2 bg-gray-50 rounded-xl">
                      <div className="relative">
                        {/* Progress Line Background */}
                        <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-gray-200 rounded"></div>
                        {/* Progress Line Fill */}
                        <div 
                          className="absolute top-4 left-[10%] h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded transition-all duration-500"
                          style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 80}%` }}
                        ></div>
                        
                        {/* Steps */}
                        <div className="flex justify-between relative">
                          {statusSteps.map((s, i) => {
                            const stepStatus = statusConfig[s];
                            const isCompleted = i <= currentStepIndex;
                            const isCurrent = i === currentStepIndex;
                            
                            return (
                              <div key={s} className="flex flex-col items-center" style={{ width: '20%' }}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 transition-all duration-300 ${
                                  isCompleted 
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                                    : 'bg-white border-2 border-gray-200 text-gray-400'
                                } ${isCurrent ? 'ring-4 ring-orange-200 scale-110' : ''}`}>
                                  {stepStatus?.icon}
                                </div>
                                <span className={`text-xs mt-2 text-center font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                  {stepStatus?.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Description */}
                  <p className="text-gray-600 mb-4 text-center font-medium">{status.description}</p>

                  {/* Driver Info for Out for Delivery */}
                  {order.status === 'out_for_delivery' && order.tracking && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 mb-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">🚗</div>
                        <div className="flex-1">
                          <p className="font-bold">{order.tracking.assignedDriver || 'Driver'}</p>
                          <p className="text-white/80 text-sm">{order.tracking.driverPhone || 'On the way to you'}</p>
                        </div>
                        {order.tracking.driverPhone && (
                          <a href={`tel:${order.tracking.driverPhone}`} className="p-3 bg-white text-indigo-600 rounded-xl font-bold">📞</a>
                        )}
                      </div>
                      {order.tracking.estimatedArrival && (
                        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                          <span className="text-white/80">Arriving at</span>
                          <span className="font-bold">{new Date(order.tracking.estimatedArrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items Preview */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item, i) => (
                        <img key={i} src={item.food?.image || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold">+{order.items.length - 3}</div>
                      )}
                    </div>
                    <span className="text-gray-600">{order.items.length} items</span>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        💳 <span className="capitalize">{order.payment?.method || 'cash'}</span>
                        {order.payment?.status === 'paid' && <span className="text-green-500 ml-1">✓ Paid</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-orange-500">{order.totalAmount.toFixed(0)} ETB</span>
                      <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};


const OrderDetailModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  const status = statusConfig[order.status] || statusConfig.pending;
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`${status.bgColor} p-6`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-70 font-mono">Order #{order._id.slice(-8).toUpperCase()}</p>
              <h2 className={`text-2xl font-bold ${status.color}`}>{status.icon} {status.label}</h2>
              <p className="text-sm opacity-70 mt-1">{status.description}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/30 rounded-xl transition text-2xl">×</button>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Tracker */}
          {order.status !== 'cancelled' && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-4">Order Progress</h3>
              <div className="relative py-2">
                <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-gray-200 rounded"></div>
                <div 
                  className="absolute top-6 left-[10%] h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded transition-all"
                  style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 80}%` }}
                ></div>
                <div className="flex justify-between relative">
                  {statusSteps.map((s, i) => {
                    const stepStatus = statusConfig[s];
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={s} className="flex flex-col items-center" style={{ width: '20%' }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 ${
                          isCompleted ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white border-2 border-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-orange-200 scale-110' : ''}`}>
                          {stepStatus?.icon}
                        </div>
                        <span className={`text-xs mt-2 text-center ${isCompleted ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{stepStatus?.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Driver Info */}
          {order.status === 'out_for_delivery' && order.tracking && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 mb-6 text-white">
              <h3 className="font-semibold mb-3 flex items-center gap-2">🚗 Your Driver</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl">👨‍✈️</div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{order.tracking.assignedDriver || 'Driver'}</p>
                  <p className="text-white/80">{order.tracking.driverPhone || 'Delivering your order'}</p>
                </div>
                {order.tracking.driverPhone && (
                  <a href={`tel:${order.tracking.driverPhone}`} className="p-3 bg-white text-indigo-600 rounded-xl font-bold">📞 Call</a>
                )}
              </div>
              {order.tracking.estimatedArrival && (
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                  <span className="text-white/80">Estimated Arrival</span>
                  <span className="font-bold text-lg">{new Date(order.tracking.estimatedArrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <img src={item.food?.image || 'https://via.placeholder.com/60'} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.food?.name || 'Item'}</p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                  </div>
                  <span className="font-semibold text-gray-800">{(item.price * item.quantity).toFixed(0)} ETB</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="mb-6 p-4 bg-orange-50 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">📍 Delivery Address</h3>
            <p className="text-gray-600">{order.deliveryAddress}</p>
            {order.location?.city && <p className="text-gray-500 text-sm">{order.location.city}, {order.location.country || 'Ethiopia'}</p>}
            {order.phone && <p className="text-gray-600 mt-2">📞 {order.phone}</p>}
          </div>

          {/* Payment */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">💳 Payment</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 capitalize">{order.payment?.method || 'Cash'}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.payment?.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                {order.payment?.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center text-xl font-bold pt-4 border-t">
            <span className="text-gray-800">Total</span>
            <span className="text-orange-500">{order.totalAmount.toFixed(0)} ETB</span>
          </div>

          {/* Order Time */}
          <p className="text-center text-gray-400 text-sm mt-4">
            Ordered on {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Orders;
