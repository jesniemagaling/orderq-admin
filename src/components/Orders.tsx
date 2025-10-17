import { useEffect, useState } from "react";
import api from "../lib/axios";

interface OrdersProps {
  role: "admin" | "cashier";
}

export default function Orders({ role }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const endpoint = role === "admin" ? "/orders/all" : "/orders/cashier";
        const res = await api.get(endpoint);
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [role]);

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#820D17]">
        {role === "admin" ? "All Orders" : "Cashier Orders"}
      </h1>

      <div className="p-4 bg-white rounded-lg shadow">
        {orders.length === 0 ? (
          <p className="text-center text-gray-500">No orders found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Table</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payment</th>
                {role === "admin" && <th className="px-3 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{order.id}</td>
                  <td className="px-3 py-2">{order.tableNumber}</td>
                  <td className="px-3 py-2">{order.status}</td>
                  <td className="px-3 py-2">{order.paymentMethod}</td>
                  {role === "admin" && (
                    <td className="px-3 py-2 text-right">
                      <button className="text-[#820D17] hover:underline">
                        View Details
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
