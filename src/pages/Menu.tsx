import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { Swiper, SwiperSlide } from 'swiper/react';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number | string;
  stocks: number;
  status: 'in_stock' | 'out_of_stock';
}

export default function Menu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<
    'all' | 'in_stock' | 'out_of_stock'
  >('all');

  const fetchMenu = async () => {
    try {
      const res = await api.get<MenuItem[]>('/menu');
      const data = res.data;
      setMenu(data);

      const uniqueCategories: string[] = [
        'All',
        ...Array.from(
          new Set(data.map((item) => String(item.category || 'Uncategorized')))
        ),
      ];
      setCategories(uniqueCategories);
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

  const formatPrice = (price: number | string) => {
    const num = Number(price);
    return isNaN(num) ? '₱0.00' : `₱${num.toFixed(2)}`;
  };

  // Filtering logic
  const filteredMenu = menu.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStock = stockFilter === 'all' || item.status === stockFilter;
    return matchesCategory && matchesStock;
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Menu</h1>

        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#820D17]/40"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Status
            </label>
            <select
              value={stockFilter}
              onChange={(e) =>
                setStockFilter(
                  e.target.value as 'all' | 'in_stock' | 'out_of_stock'
                )
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#820D17]/40"
            >
              <option value="all">All</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Add Menu Button */}
          <Button
            onClick={() => (window.location.href = '/add-menu')}
            className="flex items-center gap-2 bg-[#820D17] hover:bg-[#a41722] h-[40px] mt-5"
          >
            <PlusCircle size={18} /> Add Menu
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading menu...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <Swiper
            slidesPerView="auto"
            spaceBetween={0}
            freeMode={true}
            grabCursor={true}
            allowTouchMove={true}
            className="min-w-[1190px]"
          >
            <SwiperSlide style={{ width: 'auto' }}>
              <table className="min-w-[1190px] w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-2 font-semibold text-gray-700">
                      Product ID
                    </th>
                    <th className="p-2 font-semibold text-gray-700">Status</th>
                    <th className="p-2 font-semibold text-gray-700">
                      Product Name
                    </th>
                    <th className="p-2 font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="p-2 font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="p-2 font-semibold text-gray-700 text-center">
                      Stocks
                    </th>
                    <th className="p-2 font-semibold text-gray-700 text-center">
                      Price
                    </th>
                    <th className="p-2 font-semibold text-gray-700 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenu.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center text-gray-500 py-6"
                      >
                        No menu items found for selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMenu.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="p-2 text-gray-700">
                          #{item.id.toString().padStart(6, '0')}
                        </td>
                        <td className="p-2">
                          <span
                            className={`${
                              item.status === 'in_stock'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.status === 'in_stock'
                              ? 'In Stock'
                              : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-2 text-gray-800">{item.name}</td>
                        <td className="p-2 text-gray-800">
                          {item.category || '—'}
                        </td>
                        <td className="p-2 text-gray-500 truncate max-w-xs">
                          {item.description || '—'}
                        </td>
                        <td className="p-2 text-center text-gray-700">
                          {item.stocks}
                        </td>
                        <td className="p-2 text-center text-gray-700">
                          {formatPrice(item.price)}
                        </td>
                        <td className="p-2 text-center space-x-3">
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
            </SwiperSlide>
          </Swiper>
        </div>
      )}
    </div>
  );
}
