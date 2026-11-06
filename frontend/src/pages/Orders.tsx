import { useEffect, useState } from 'react';
import { orderService } from '../services/food.service';
import type { Order } from '../services/food.service';
import { Link } from 'react-router-dom';

const statusConfig: Record<
  string,
  { color: string; bgColor: string; icon: string; label: string; description: string }
> = {
  pending: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100/80 border-amber-200',
    icon: '⏳',
    label: 'Order Placed',
    description: 'We have received your order and sent it to the kitchen.',
  },
  confirmed: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100/80 border-blue-200',
    icon: '✅',
    label: 'Confirmed',
    description: 'The kitchen has accepted your order and began preparation.',
  },
  preparing: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-100/80 border-purple-200',
    icon: '👨‍🍳',
    label: 'Cooking & Packing',
    description: 'Your food is sizzling on the stove and packed fresh.',
  },
  out_for_delivery: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100/80 border-emerald-200',
    icon: '🛵',
    label: 'On the Way',
    description: 'Your courier has picked up your food and is heading to you.',
  },
  delivered: {
    color: 'text-green-800',
    bgColor: 'bg-green-100/80 border-green-200',
    icon: '🎉',
    label: 'Delivered',
    description: 'Meal arrived! Enjoy your food with family & friends.',
  },
  cancelled: {
    color: 'text-red-700',
    bgColor: 'bg-red-100/80 border-red-200',
    icon: '❌',
    label: 'Cancelled',
    description: 'This order was cancelled.',
  },
};

const statusSteps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getMyOrders();
      setOrders(response.data.orders);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-orange-200 rounded-full animate-spin border-t-orange-500" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl animate-bounce">
            🛵
          </div>
        </div>
        <p className="mt-5 text-slate-600 font-display font-bold text-lg">
          Fetching your order records...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              📦 My Orders & Tracking
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Live updates • Last checked at {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="self-start sm:self-auto px-4 py-2.5 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <span className="text-sm">🔄</span>
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-orange-100 shadow-xl shadow-orange-500/5">
            <span className="text-6xl block mb-4">🍽️</span>
            <h2 className="font-display font-black text-2xl text-slate-800 mb-2">No Orders Yet</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">
              You haven't ordered anything yet! Explore our fresh Ethiopian menu and treat yourself.
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-display font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <span>Explore Menu</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          /* Order Cards List */
          <div className="space-y-6">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const isActive = !['delivered', 'cancelled'].includes(order.status);
              const currentStepIndex = statusSteps.indexOf(order.status);

              return (
                <div
                  key={order._id}
                  className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
                    isActive ? 'border-orange-300/80 ring-2 ring-orange-400/20' : 'border-slate-200/70'
                  }`}
                >
                  {/* Active Header Banner */}
                  {isActive && (
                    <div className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 px-6 py-2.5 flex items-center justify-between text-white text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Active Delivery in Progress</span>
                      </div>
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
                        {status.icon} {status.label}
                      </span>
                    </div>
                  )}

                  <div className="p-6 sm:p-7">
                    
                    {/* ID & Date Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-lg text-slate-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          {!isActive && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${status.bgColor} ${status.color}`}
                            >
                              {status.icon} {status.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ordered on{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total</span>
                        <span className="font-display font-black text-xl text-slate-900">
                          {order.totalAmount.toFixed(0)}{' '}
                          <span className="text-xs text-orange-600 font-bold">ETB</span>
                        </span>
                      </div>
                    </div>

                    {/* Active Stepper Visual */}
                    {order.status !== 'cancelled' && (
                      <div className="mb-6 p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
                        <div className="relative">
                          {/* Background Track */}
                          <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-slate-200 rounded-full" />
                          {/* Animated Fill Track */}
                          <div
                            className="absolute top-4 left-[10%] h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(80, (Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 80)}%`,
                            }}
                          />

                          {/* Step Nodes */}
                          <div className="flex justify-between relative">
                            {statusSteps.map((s, idx) => {
                              const stepCfg = statusConfig[s];
                              const isCompleted = idx <= currentStepIndex;
                              const isCurrent = idx === currentStepIndex;
                              return (
                                <div key={s} className="flex flex-col items-center w-1/5 text-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs z-10 transition-all ${
                                      isCompleted
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/25'
                                        : 'bg-white border-2 border-slate-200 text-slate-400'
                                    } ${isCurrent ? 'ring-4 ring-orange-300/40 scale-110' : ''}`}
                                  >
                                    {isCompleted ? '✓' : idx + 1}
                                  </div>
                                  <span
                                    className={`text-[11px] mt-2 font-bold leading-tight ${
                                      isCompleted ? 'text-slate-800' : 'text-slate-400'
                                    }`}
                                  >
                                    {stepCfg.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <p className="text-center text-xs text-slate-500 font-medium mt-4">
                          {status.description}
                        </p>
                      </div>
                    )}

                    {/* Driver Card (if assigned) */}
                    {order.status === 'out_for_delivery' && order.tracking && (
                      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-4.5 rounded-2xl mb-5 shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                            🛵
                          </div>
                          <div>
                            <p className="font-display font-bold text-sm">
                              {order.tracking.assignedDriver || 'Assigned Courier'}
                            </p>
                            <p className="text-xs text-white/80">
                              {order.tracking.driverPhone ? `Phone: ${order.tracking.driverPhone}` : 'En route to your location'}
                            </p>
                          </div>
                        </div>
                        {order.tracking.driverPhone && (
                          <a
                            href={`tel:${order.tracking.driverPhone}`}
                            className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-display font-bold text-xs shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                          >
                            <span>📞</span>
                            <span>Call Driver</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Order Items Preview */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((it, idx) => (
                            <img
                              key={idx}
                              src={it.food?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border-2 border-white bg-slate-100"
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-600 font-medium">
                          {order.items.length} {order.items.length === 1 ? 'dish' : 'dishes'} (
                          {order.items.map((it) => it.food?.name).filter(Boolean).slice(0, 2).join(', ')}
                          {order.items.length > 2 && '...'})
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-xl font-bold text-xs transition-colors self-end sm:self-auto"
                      >
                        View Full Details →
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

const OrderDetailModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-6 border-b ${status.bgColor}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
              <h2 className={`font-display font-bold text-2xl ${status.color}`}>
                {status.icon} {status.label}
              </h2>
              <p className="text-xs text-slate-600 mt-1">{status.description}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Order Items */}
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
              Items Ordered
            </h3>
            <div className="space-y-2.5">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.food?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-white"
                    />
                    <div>
                      <p className="font-display font-bold text-slate-900 text-sm">{it.food?.name || 'Dish'}</p>
                      <p className="text-xs text-slate-400">Qty: {it.quantity} × {it.price.toFixed(0)} ETB</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-slate-900 text-sm">
                    {(it.price * it.quantity).toFixed(0)} ETB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-2xl">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-orange-800 mb-1.5 flex items-center gap-1.5">
              <span>📍</span>
              <span>Delivery Address</span>
            </h4>
            <p className="text-xs text-slate-700 font-medium">{order.deliveryAddress || 'Standard Delivery'}</p>
            {order.phone && (
              <p className="text-xs text-slate-500 mt-1">Contact: {order.phone}</p>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Payment Method</p>
              <p className="font-display font-bold text-slate-900 uppercase text-sm">
                {order.payment?.method || 'Cash on Delivery'}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.payment?.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {order.payment?.status === 'paid' ? '✓ Paid' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex items-baseline justify-between pt-4 border-t border-slate-100">
            <span className="font-display font-bold text-lg text-slate-900">Total Charged</span>
            <span className="font-display font-black text-2xl text-orange-600">
              {order.totalAmount.toFixed(0)} ETB
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Orders;
