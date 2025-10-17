import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import MainLayout from "./layouts/MainLayout";
import Overview from "./pages/Overview";
import Orders from "./components/Orders";
import Menu from "./pages/Menu";
import Tables from "./pages/Tables";
import KitchenOrders from "./pages/KitchenOrders";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Main layout routes */}
        <Route element={<MainLayout />}>
          {/* Admin */}
          <Route path="/admin" element={<Overview />} />
          <Route path="/admin/orders" element={<Orders role="admin" />} />
          <Route path="/admin/menu" element={<Menu />} />

          {/* Cashier */}
          <Route path="/cashier/tables" element={<Tables />} />
          <Route path="/cashier/orders" element={<Orders role="cashier" />} />

          {/* Kitchen */}
          <Route path="/kitchen/orders" element={<KitchenOrders />} />
        </Route>
      </Routes>
    </Router>
  );
}
