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
  Brush,
} from 'recharts';
import { format } from 'date-fns';
import api from '../lib/axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

type Order = {
  id: number;
  table_id?: number;
  table_number?: string;
  name?: string;
  total_amount?: number;
  status?: string;
  created_at?: string;
};

type TopItem = { name: string; amount: number; delta?: number };

const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

export default function Overview() {
  const [loading, setLoading] = useState(true);

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
  const [salesInterval, setSalesInterval] = useState<
    'hourly' | 'weekly' | 'monthly'
  >('hourly');

  useEffect(() => {
    // Main reusable dashboard loader
    const refreshDashboard = async () => {
      try {
        setLoading(true);

        // Define today's date range
        const today = new Date();
        const start = `${today.toISOString().slice(0, 10)} 00:00:00`;
        const end = `${today.toISOString().slice(0, 10)} 23:59:59`;

        // Fetch all data in parallel
        const [
          tablesRes,
          ordersRes,
          ordersAllRes,
          salesRes,
          topItemsRes,
          revenueRes,
        ] = await Promise.allSettled([
          api.get('/tables'),
          api.get('/orders?limit=10&sort=desc'),
          api.get('/orders'),
          api.get(`/orders/sales-graph?interval=${salesInterval}`),
          api.get('/menu/top-selling'),
          api.get(`/orders/revenue?start=${start}&end=${end}`),
        ]);

        // TABLES
        if (tablesRes.status === 'fulfilled') {
          const tables = tablesRes.value.data as any[];
          setTablesTotal(tables.length);
          const occupied = tables.filter(
            (t) => t.status !== 'available'
          ).length;
          setTablesOccupied(occupied);
        } else {
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
              total_amount: 1305,
              status: 'in_progress',
              created_at: new Date().toISOString(),
            },
            {
              id: 5,
              table_number: '13',
              name: 'Emma Brown',
              total_amount: 1305,
              status: 'served',
              created_at: new Date().toISOString(),
            },
          ]);
        }

        // ALL ORDERS
        if (ordersAllRes.status === 'fulfilled') {
          const all = ordersAllRes.value.data as Order[];

          // Active orders
          setActiveOrdersCount(
            all.filter(
              (o) =>
                o.status === 'in_progress' ||
                o.status === 'unserved' ||
                o.status === 'pending'
            ).length
          );

          // Kitchen queue
          setKitchenQueue(
            all.filter(
              (o) => o.status === 'pending' || o.status === 'pending_kitchen'
            ).length
          );
        } else {
          setActiveOrdersCount(20);
          setKitchenQueue(16);
        }

        //Today's Revenue
        if (revenueRes.status === 'fulfilled') {
          const rows = revenueRes.value.data;
          if (Array.isArray(rows) && rows.length > 0) {
            setTodayRevenue(Number(rows[0].total || 0));
          } else {
            setTodayRevenue(0);
          }
        } else {
          setTodayRevenue(0);
        }

        // SALES SERIES
        if (salesRes.status === 'fulfilled') {
          const series = salesRes.value.data;
          if (Array.isArray(series) && series.length) {
            setSalesSeries(
              series.map((s: any) => ({
                time: s.time,
                value: Number(s.value || 0),
              }))
            );
          } else {
            if (salesInterval === 'hourly') {
              setSalesSeries(
                [10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => ({
                  time:
                    h === 0
                      ? '12AM'
                      : h < 12
                      ? `${h}AM`
                      : h === 12
                      ? '12PM'
                      : `${h - 12}PM`,
                  value: Math.round(5000 + Math.random() * 15000),
                }))
              );
            } else if (salesInterval === 'weekly') {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              setSalesSeries(
                days.map((d) => ({
                  time: d,
                  value: Math.round(10000 + Math.random() * 20000),
                }))
              );
            } else if (salesInterval === 'monthly') {
              const months = [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ];
              setSalesSeries(
                months.map((m) => ({
                  time: m,
                  value: Math.round(50000 + Math.random() * 100000),
                }))
              );
            }
          }
        } else {
          if (salesInterval === 'hourly') {
            setSalesSeries(
              [10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => ({
                time:
                  h === 0
                    ? '12AM'
                    : h < 12
                    ? `${h}AM`
                    : h === 12
                    ? '12PM'
                    : `${h - 12}PM`,
                value: Math.round(5000 + Math.random() * 15000),
              }))
            );
          } else if (salesInterval === 'weekly') {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            setSalesSeries(
              days.map((d) => ({
                time: d,
                value: Math.round(10000 + Math.random() * 20000),
              }))
            );
          } else if (salesInterval === 'monthly') {
            const months = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec',
            ];
            setSalesSeries(
              months.map((m) => ({
                time: m,
                value: Math.round(50000 + Math.random() * 100000),
              }))
            );
          }
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

    // Socket Realtime Updates
    socket.on('connect', () => {
      console.log('[Overview] Connected to socket:', socket.id);
    });

    socket.on('tableStatusUpdate', (data) => {
      console.log('[Overview] Table status changed:', data);
      refreshDashboard();
    });

    socket.on('newOrder', (data) => {
      console.log('[Overview] New order received:', data);
      refreshDashboard();
    });

    socket.on('disconnect', () => {
      console.log('[Overview] Disconnected from socket');
    });

    // Initial dashboard load
    refreshDashboard();

    // Cleanup
    return () => {
      socket.off('tableStatusUpdate');
      socket.off('newOrder');
    };
  }, [salesInterval]);

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
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <Users size={28} className="text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Orders</p>
            <p className="text-2xl font-semibold">{activeOrdersCount}</p>
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
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <DollarSign size={28} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Kitchen Queue</p>
            <p className="text-2xl font-semibold">{kitchenQueue}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <Clock size={28} className="text-blue-500" />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* left: latest orders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col h-full">
          <h2 className="text-lg font-semibold mb-4">Latest Orders</h2>

          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b text-gray-600 text-xs font-medium">
                <tr>
                  <th className="py-2 pl-3 text-left w-[15%]">Order#</th>
                  <th className="py-2 text-left w-[15%]">Time</th>
                  <th className="py-2 text-left w-[15%]">Table</th>
                  <th className="py-2 text-right w-[5%] pr-6">Amount</th>
                  <th className="py-2 text-center w-[20%] pr-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {latestOrders.length > 0 ? (
                  latestOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-3 pl-3 text-gray-700">{o.id}</td>
                      <td className="py-3 text-gray-600">
                        {o.created_at
                          ? format(new Date(o.created_at), 'HH:mm')
                          : '-'}
                      </td>
                      <td className="py-3 text-left text-gray-700">
                        {o.table_number || o.table_id || '-'}
                      </td>
                      <td className="py-3 pr-6 text-center font-medium text-gray-800">
                        {formatCurrency(Number(o.total_amount || 0))}
                      </td>
                      <td className="py-3 text-center pr-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[75px] text-center ${
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">
                      No recent orders available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* right column: charts & top sellers */}
        <div className="flex flex-col space-y-6 h-full">
          <div className="bg-white rounded-lg shadow-sm p-6 flex-1">
            <div className="flex items-center gap-2 justify-between mb-4">
              <h3 className="font-semibold">Sales Performance</h3>
              <select
                value={salesInterval}
                onChange={(e) =>
                  setSalesInterval(
                    e.target.value as 'hourly' | 'weekly' | 'monthly'
                  )
                }
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#820D17]/40"
              >
                <option value="hourly">Hourly</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesSeries}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      border: '1px solid #eee',
                    }}
                    formatter={(value: number) => [
                      `₱${value.toLocaleString()}`,
                      'Sales',
                    ]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#820D17"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, fill: '#820D17', stroke: '#fff' }}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex-1 overflow-y-auto">
            <h3 className="font-semibold mb-4">Top selling items</h3>
            <ul className="space-y-3">
              {topSelling.map((t, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">Sales</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₱{t.amount}</div>
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
