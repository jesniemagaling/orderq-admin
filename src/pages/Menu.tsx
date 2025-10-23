import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  stocks: number;
  status: 'in_stock' | 'out_of_stock';
}

export default function Menu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      setMenu(res.data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      setMenu((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
        <button
          onClick={() => (window.location.href = '/add-menu')}
          className="flex items-center gap-2 bg-[#820D17] text-white px-5 py-2 rounded-md shadow hover:bg-[#a41722] transition"
        >
          <PlusCircle size={18} /> Add Menu
        </button>
      </div>

      {loading ? (
        <p>Loading menu...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-700">
                  Product ID
                </th>
                <th className="px-6 py-3 font-medium text-gray-700">Status</th>
                <th className="px-6 py-3 font-medium text-gray-700">
                  Product Name
                </th>
                <th className="px-6 py-3 font-medium text-gray-700">
                  Description
                </th>
                <th className="px-6 py-3 font-medium text-gray-700 text-center">
                  Stocks
                </th>
                <th className="px-6 py-3 font-medium text-gray-700 text-center">
                  Price
                </th>
                <th className="px-6 py-3 font-medium text-gray-700 text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {menu.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-6">
                    No menu items found.
                  </td>
                </tr>
              ) : (
                menu.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-3 font-medium text-gray-700">
                      #{item.id.toString().padStart(6, '0')}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`${
                          item.status === 'in_stock'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        } font-medium`}
                      >
                        {item.status === 'in_stock'
                          ? 'In Stock'
                          : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-3 text-gray-500 truncate max-w-xs">
                      {item.description || '—'}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      {item.stocks}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-700">
                      ₱{item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-center space-x-3">
                      <button
                        className="text-green-600 hover:text-green-800 font-medium inline-flex items-center gap-1"
                        onClick={() =>
                          (window.location.href = `/menu/edit/${item.id}`)
                        }
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
