// src/pages/Overview.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Coffee,
  DollarSign,
  Clock,
  Users,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import api from '../lib/axios';
import { toast } from 'react-toastify';

type Order = {
  id: number;
  table_id?: number;
  table_number?: string;
  name?: string;
  amount?: number;
  status?: string;
  created_at?: string;
};

type TopItem = { name: string; amount: number; delta?: number };

export default function Overview() {
  const [loading, setLoading] = useState(true);

  // KPI states
  const [tablesTotal, setTablesTotal] = useState(0);
  const [tablesOccupied, setTablesOccupied] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [kitchenQueue, setKitchenQueue] = useState(0);

  // lists
  const [latestOrders, setLatestOrders] = useState<Order[]>([]);
  const [salesSeries, setSalesSeries] = useState<
    { time: string; value: number }[]
  >([]);
  const [topSelling, setTopSelling] = useState<TopItem[]>([]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        // Fire main requests in parallel
        const [tablesRes, ordersRes, ordersAllRes, salesRes, topItemsRes] =
          await Promise.allSettled([
            api.get('/tables'), // expected: array of tables with status
            api.get('/orders?limit=10&sort=desc'), // expected: recent orders
            api.get('/orders'), // all orders to compute counts
            api.get('/orders/sales-graph?interval=hourly'), // expected: [{time, value}]
            api.get('/menu/top-selling'), // expected top items array
          ]);

        // TABLES
        if (tablesRes.status === 'fulfilled') {
          const tables = tablesRes.value.data as any[];
          setTablesTotal(tables.length);
          // adjust depending on your table.status values
          const occupied = tables.filter(
            (t) => t.status !== 'available'
          ).length;
          setTablesOccupied(occupied);
        } else {
          // fallback mock
          setTablesTotal(13);
          setTablesOccupied(5);
        }

        // LATEST ORDERS
        if (ordersRes.status === 'fulfilled') {
          setLatestOrders(ordersRes.value.data || []);
        } else {
          setLatestOrders([
            {
              id: 13,
              table_number: '09',
              name: 'Kim Sabu',
              amount: 1305,
              status: 'in_progress',
              created_at: new Date().toISOString(),
            },
            {
              id: 5,
              table_number: '13',
              name: 'Emma Brown',
              amount: 1305,
              status: 'served',
              created_at: new Date().toISOString(),
            },
          ]);
        }

        // ALL ORDERS (counts & revenue)
        if (ordersAllRes.status === 'fulfilled') {
          const all = ordersAllRes.value.data as Order[];
          // active orders can be in_progress/unserved/pending depending on backend conventions
          setActiveOrdersCount(
            all.filter(
              (o) =>
                o.status === 'in_progress' ||
                o.status === 'unserved' ||
                o.status === 'pending'
            ).length
          );

          // today's revenue: sum orders placed today or use endpoint
          const today = new Date().toISOString().slice(0, 10);
          const revenue = all
            .filter((o) => o.created_at?.slice(0, 10) === today)
            .reduce((s, o) => s + Number(o.amount || 0), 0);
          setTodayRevenue(revenue);
          setKitchenQueue(
            all.filter(
              (o) => o.status === 'pending' || o.status === 'pending_kitchen'
            ).length
          );
        } else {
          setActiveOrdersCount(20);
          setTodayRevenue(513);
          setKitchenQueue(16);
        }

        // SALES SERIES
        if (salesRes.status === 'fulfilled') {
          const series = salesRes.value.data;
          // If the backend returns [{time: '12:00', value: 1000}, ...] we use it.
          if (Array.isArray(series) && series.length) {
            setSalesSeries(
              series.map((s: any) => ({
                time: s.time,
                value: Number(s.value || 0),
              }))
            );
          } else {
            // fallback mock hourly
            const now = new Date();
            setSalesSeries(
              [12, 13, 14, 15, 16, 17, 18].map((h) => ({
                time: `${h}:00`,
                value: Math.round(5000 + Math.random() * 15000),
              }))
            );
          }
        } else {
          setSalesSeries(
            [12, 13, 14, 15, 16, 17, 18].map((h) => ({
              time: `${h}:00`,
              value: Math.round(5000 + Math.random() * 15000),
            }))
          );
        }

        // TOP SELLING
        if (topItemsRes.status === 'fulfilled') {
          setTopSelling(topItemsRes.value.data || []);
        } else {
          setTopSelling([
            { name: 'Burgers', amount: 1658, delta: 1.2 },
            { name: 'Chicken', amount: 1658, delta: 0.8 },
            { name: 'Pizza', amount: 100, delta: -0.4 },
            { name: 'Salad', amount: 1658, delta: 0.2 },
          ]);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // derived: occupancy label
  const occupancyText = useMemo(
    () => `${tablesOccupied}/${tablesTotal}`,
    [tablesOccupied, tablesTotal]
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Overview</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Occupancy</p>
            <p className="text-2xl font-semibold">{occupancyText}</p>
            <p className="text-sm text-green-600 flex items-center gap-2 mt-1">
              <TrendingUp size={14} /> 16%{' '}
              <span className="text-gray-500 ml-2">Up from last hour</span>
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <Users size={28} className="text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Orders</p>
            <p className="text-2xl font-semibold">{activeOrdersCount}</p>
            <p className="text-sm text-green-600 mt-1">
              ▲ 13%{' '}
              <span className="text-gray-500 ml-2">Up from last hour</span>
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <Bell size={28} className="text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Today's Revenue</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(todayRevenue)}
            </p>
            <p className="text-sm text-red-500 mt-1">
              ▼ 5%{' '}
              <span className="text-gray-500 ml-2">Down from last hour</span>
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <DollarSign size={28} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Kitchen Queue</p>
            <p className="text-2xl font-semibold">{kitchenQueue}</p>
            <p className="text-sm text-green-600 mt-1">
              ▲ 9% <span className="text-gray-500 ml-2">Up from last hour</span>
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <Clock size={28} className="text-blue-500" />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left: latest orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Latest Orders</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="pb-3">Order#</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Table</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="py-3">{o.id}</td>
                    <td className="py-3">
                      {o.created_at
                        ? format(new Date(o.created_at), 'HH:mm')
                        : '-'}
                    </td>
                    <td className="py-3">
                      {o.table_number || o.table_id || '-'}
                    </td>
                    <td className="py-3">{o.name || '-'}</td>
                    <td className="py-3 text-right">
                      {formatCurrency(Number(o.amount || 0))}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          o.status === 'served'
                            ? 'bg-green-100 text-green-700'
                            : o.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {o.status?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* right column: charts & top sellers */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sales Performance</h3>
              <div className="text-sm text-gray-500">Hourly</div>
            </div>

            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesSeries}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#B91C1C"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Top selling items</h3>
            <ul className="space-y-3">
              {topSelling.map((t, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">Sales</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{t.amount}</div>
                    <div
                      className={`text-xs ${
                        t.delta && t.delta > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {t.delta ? `${t.delta > 0 ? '+' : ''}${t.delta}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
