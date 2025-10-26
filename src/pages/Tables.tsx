import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../lib/axios';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const socket: Socket = io('http://localhost:5000', {
  transports: ['websocket'], // ensures stable connection
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
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  is_additional?: boolean;
}

interface Table {
  id: number;
  table_number: string;
  status: 'available' | 'occupied' | 'in_progress' | 'served';
  has_additional_order?: boolean;
}

interface TableDetailsResponse {
  table: Table;
  session: { id: number; token: string } | null;
  orders: Order[];
  has_additional_order: boolean;
}

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // Fetch all tables from API
  const fetchTables = async () => {
    try {
      const res = await api.get<Table[]>('/tables');
      const sorted = res.data.sort(
        (a, b) => Number(a.table_number) - Number(b.table_number)
      );
      setTables(sorted);
    } catch (err) {
      console.error('Failed to load tables', err);
    } finally {
      setLoading(false);
    }
  };

  // Establish socket and handle incoming updates
  useEffect(() => {
    fetchTables();

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.warn('Disconnected from WebSocket server');
    });

    socket.on('newOrder', (data: { tableId: number }) => {
      console.warn('Received new order for table:', data.tableId);

      setTables((prev) =>
        prev.map((t) =>
          t.id === data.tableId ? { ...t, has_additional_order: true } : t
        )
      );

      // Optionally refresh if the same table is open
      setSelectedTable((prev) => {
        if (prev && prev.id === data.tableId) {
          fetchTableOrders(data.tableId);
        }
        return prev;
      });
    });

    socket.on('tableStatusUpdate', ({ tableId, status }) => {
      console.log('Table status updated:', tableId, status);

      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );

      setSelectedTable((prev) =>
        prev && prev.id === tableId ? { ...prev, status } : prev
      );
    });

    return () => {
      socket.off('newOrder');
      socket.off('tableStatusUpdate');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  // Fetch specific table’s orders
  const fetchTableOrders = async (tableId: number) => {
    try {
      const res = await api.get<TableDetailsResponse>(
        `/tables/${tableId}/details`
      );
      const data = res.data;

      const sortedOrders = data.orders.map((order, index) => ({
        ...order,
        is_additional: index > 0,
      }));

      setOrders(sortedOrders);

      // remove the red dot once table is opened
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId ? { ...t, has_additional_order: false } : t
        )
      );
    } catch (err) {
      console.error('Failed to load table orders', err);
      setOrders([]);
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    fetchTableOrders(table.id);
  };

  const handlePrintInvoice = (order: Order) => {
    setPrintOrder(order);
  };

  const handleConfirmPrint = async () => {
    if (printOrder) {
      try {
        window.print();
        await api.post(`/orders/${printOrder.id}/confirm`);

        // Update table orders so the confirmed one changes to unserved
        setOrders((prev) =>
          prev.map((order) =>
            order.id === printOrder.id
              ? { ...order, status: 'unserved' }
              : order
          )
        );

        // Optionally mark the table as "in progress"
        if (selectedTable) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === selectedTable.id ? { ...t, status: 'in_progress' } : t
            )
          );
        }

        setPrintOrder(null);
        console.log(`Order #${printOrder.id} confirmed and updated`);
      } catch (error) {
        console.error('Failed to confirm order:', error);
      }
    }
  };

  if (loading) return <p>Loading tables...</p>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-500';
      case 'occupied':
        return 'text-red-600';
      case 'in_progress':
        return 'text-yellow-500';
      case 'served':
        return 'text-blue-400';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex gap-10">
      <div className="w-1/2">
        <h1 className="text-3xl font-bold mb-6">All Tables</h1>

        {tables.length === 0 ? (
          <p className="text-gray-500">No tables found.</p>
        ) : (
          <div className="space-y-4">
            {tables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`relative cursor-pointer flex justify-between rounded-xl p-4 shadow transition ${
                  selectedTable?.id === table.id
                    ? 'bg-primary text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-medium text-lg">
                    Table #{table.table_number}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      selectedTable?.id === table.id
                        ? 'text-white'
                        : getStatusColor(table.status)
                    }`}
                  >
                    {table.status
                      .replace('_', ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>

                {/*notification*/}
                {table.has_additional_order && (
                  <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-600 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 py-4 px-2">
        {selectedTable ? (
          <>
            <h2 className="text-right text-lg font-medium mb-6">
              Table#: {selectedTable.table_number}
            </h2>

            {orders.length > 0 ? (
              <>
                {orders.map((order, orderIdx) => (
                  <div key={order.id} className="mb-8 border-b px-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-semibold">
                        {orderIdx === 0
                          ? 'Main Order'
                          : `Additional Order #${orderIdx}`}
                        <span className="ml-2 text-sm text-gray-500">
                          (
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          )
                        </span>
                      </h3>
                      {order.status === 'pending' && (
                        <Button
                          className="bg-primary"
                          onClick={() => handlePrintInvoice(order)}
                        >
                          Print Invoice
                        </Button>
                      )}
                    </div>

                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 font-medium text-gray-600 text-left w-[60%]">
                            Product
                          </th>
                          <th className="py-2 font-medium text-gray-600 text-center w-[20%]">
                            Qty
                          </th>
                          <th className="py-2 font-medium text-gray-600 text-right w-[20%]">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-1 w-[60%]">{item.name}</td>
                            <td className="py-1 text-center w-[20%]">
                              {item.quantity}
                            </td>
                            <td className="py-1 text-right w-[20%]">
                              ₱{(item.price * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-gray-500 mt-10 text-center">
                No orders for this table.
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500 mt-10 text-center">
            Select a table to view details
          </p>
        )}
      </div>

      {/* PRINT ORDER */}
      <Modal isOpen={!!printOrder} onClose={() => setPrintOrder(null)}>
        {printOrder && (
          <>
            <h2 className="text-lg font-semibold mb-3">
              {printOrder.is_additional
                ? `Additional Order #${orders.findIndex(
                    (o) => o.id === printOrder.id
                  )}`
                : 'Main Order'}
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              Date:{' '}
              {new Date(printOrder.created_at).toLocaleString([], {
                hour: '2-digit',
                minute: '2-digit',
                month: 'short',
                day: '2-digit',
              })}
            </p>

            <table className="w-full text-sm mb-3">
              <tbody>
                {printOrder.items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1">{item.name}</td>
                    <td className="py-1 text-center">{item.quantity}x</td>
                    <td className="py-1 text-right">
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-sm space-y-1 mb-6">
              <p>
                Subtotal: ₱
                {Number(printOrder.total_amount || 0).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
              <p>
                Tax: ₱
                {(Number(printOrder.total_amount || 0) * 0.015).toFixed(2)}
              </p>
              <p className="font-medium">
                Total: ₱
                {(
                  Number(printOrder.total_amount || 0) +
                  Number(printOrder.total_amount || 0) * 0.015
                ).toFixed(2)}
              </p>
            </div>

            <Button className="w-full bg-primary" onClick={handleConfirmPrint}>
              Confirm
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}
