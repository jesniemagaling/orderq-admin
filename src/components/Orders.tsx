import { useEffect, useState } from 'react';
import api from '../lib/axios';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders'); // backend route
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;

  return (
    <>
      <h1 className="text-3xl font-semibold">Orders</h1>
      <div className="p-4 mt-6">
        <h2 className="text-xl mb-4 font-medium">All Orders</h2>

        {orders.length === 0 ? (
          <p className="text-center text-gray-500">No orders found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="relative flex justify-between rounded-xl bg-white p-4 shadow hover:shadow-md transition"
              >
                <div className="space-y-2">
                  <p className="text-lg">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    Table: {order.table_id}
                  </p>
                </div>

                <div className="space-y-2">
                  <p
                    className={`text-sm ${
                      order.status === 'paid'
                        ? 'text-green-600'
                        : 'text-red-800'
                    }`}
                  >
                    {order.status}
                  </p>
                  <p className="text-lg">
                    ₱{Number(order.total_amount).toLocaleString()}
                  </p>
                </div>

                {order.hasAlert && (
                  <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-[#820D17]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
