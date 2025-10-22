import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../lib/axios';
import Button from '../components/ui/Button';

const socket: Socket = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  table_id: number;
  table_number: string;
}

export default function KitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesWithNotif, setTablesWithNotif] = useState<number[]>([]);

  // Fetch unserved + served
  const fetchOrders = async () => {
    try {
      const res = await api.get<Order[]>('/orders');
      const filtered = res.data.filter(
        (o) => o.status === 'unserved' || o.status === 'served'
      );
      setOrders(filtered);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch for selected table
  const fetchOrdersForTable = async (tableId: number) => {
    try {
      const res = await api.get(`/tables/${tableId}/details`);
      const data = res.data.orders.filter(
        (order: Order) =>
          order.status === 'unserved' || order.status === 'served'
      );

      const sorted = data.sort((a: Order, b: Order) =>
        a.created_at.localeCompare(b.created_at)
      );

      setTableOrders(sorted);
    } catch (err) {
      console.error('Failed to fetch table orders', err);
    }
  };
  useEffect(() => {
    fetchOrders();

    socket.on('newOrder', async ({ tableId }) => {
      setTablesWithNotif((prev) =>
        prev.includes(tableId) ? prev : [...prev, tableId]
      );

      // Refresh all tables' data
      await fetchOrders();

      // If the same table is currently selected, refresh its orders
      if (selectedTableId === tableId) {
        const res = await api.get(`/tables/${tableId}/details`);
        const confirmed = res.data.orders.filter(
          (o: Order) => o.status === 'unserved' || o.status === 'served'
        );

        // Check if there’s a new order not already shown
        setTableOrders((prev) => {
          const existingIds = prev.map((o) => o.id);
          const newOnes = confirmed.filter(
            (o: Order) => !existingIds.includes(o.id)
          );
          return [...prev, ...newOnes];
        });
      }
    });

    socket.on('tableStatusUpdate', ({ tableId, status }) => {
      if (['unserved', 'served'].includes(status)) {
        fetchOrders();
        if (selectedTableId === tableId) fetchOrdersForTable(tableId);
      }
    });

    return () => {
      socket.off('newOrder');
      socket.off('tableStatusUpdate');
    };
  }, [selectedTableId]);

  const handleTableClick = (tableId: number) => {
    setSelectedTableId(tableId);
    fetchOrdersForTable(tableId);
    setTablesWithNotif((prev) => prev.filter((id) => id !== tableId));
  };

  // Mark all unserved orders of table as served
  const handleMarkAsDone = async (tableId: number) => {
    try {
      const unservedOrders = tableOrders.filter((o) => o.status === 'unserved');
      for (const order of unservedOrders) {
        await api.put(`/orders/${order.id}/serve`);
      }

      // Update UI instantly
      setOrders((prev) =>
        prev.map((o) =>
          o.table_id === tableId ? { ...o, status: 'served' } : o
        )
      );
      setTableOrders((prev) =>
        prev.map((o) =>
          o.status === 'unserved' ? { ...o, status: 'served' } : o
        )
      );

      await fetchOrders();
      await fetchOrdersForTable(tableId);
    } catch (err) {
      console.error('Failed to mark as served:', err);
    }
  };

  // Group tables
  const tables = Object.values(
    orders.reduce((acc, order) => {
      if (!acc[order.table_id]) {
        acc[order.table_id] = {
          id: order.table_id,
          table_number: order.table_number,
          has_additional_order: tablesWithNotif.includes(order.table_id),
          hasUnserved: false,
          hasServed: false,
        };
      }
      if (order.status === 'unserved') acc[order.table_id].hasUnserved = true;
      if (order.status === 'served') acc[order.table_id].hasServed = true;
      return acc;
    }, {} as Record<number, { id: number; table_number: string; has_additional_order: boolean; hasUnserved: boolean; hasServed: boolean }>)
  );

  if (loading) return <p>Loading orders...</p>;

  return (
    <div className="flex gap-10">
      <div className="w-1/2">
        <h1 className="text-3xl font-semibold mb-6">All Orders</h1>

        {tables.length === 0 ? (
          <p className="text-gray-500">No active orders.</p>
        ) : (
          <div className="space-y-4">
            {tables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleTableClick(table.id)}
                className={`relative cursor-pointer flex justify-between rounded-xl p-4 shadow transition ${
                  selectedTableId === table.id
                    ? 'bg-[#820D17] text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <span className="font-medium text-lg">
                  Table #{table.table_number}
                </span>
                <span
                  className={`text-sm font-medium ${
                    table.hasUnserved
                      ? selectedTableId === table.id
                        ? 'text-white'
                        : 'text-red-600'
                      : 'text-blue-400'
                  }`}
                >
                  {table.hasUnserved ? 'Unserved' : 'Served'}
                </span>

                {table.has_additional_order && (
                  <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-600 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 py-4 px-2">
        {selectedTableId ? (
          <>
            <h2 className="text-right text-lg font-medium mb-6">
              Table#:{' '}
              {tables.find((t) => t.id === selectedTableId)?.table_number}
            </h2>

            {tableOrders.length > 0 ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product Name</th>
                        <th className="text-right py-2">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableOrders[0]?.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-1">{item.name}</td>
                          <td className="py-1 text-right">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {tableOrders.some((o) => o.status === 'unserved') && (
                  <Button
                    className="bg-[#820D17] ml-auto block"
                    onClick={() => handleMarkAsDone(selectedTableId)}
                  >
                    Done
                  </Button>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center mt-10">
                No active orders for this table.
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center mt-10">
            Select a table to view orders.
          </p>
        )}
      </div>
    </div>
  );
}
