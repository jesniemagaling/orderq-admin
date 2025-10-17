import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import Button from "../components/ui/Button"

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", form); 
      // Your backend should return { token, role }

      const { token, role } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      if (role === "admin") navigate("/admin");
      else if (role === "cashier") navigate("/cashier");
      else if (role === "kitchen") navigate("/kitchen");
      else setError("Unknown role. Contact admin.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white shadow-lg rounded-xl">
        
        <h2 className="mb-2 text-2xl font-bold text-center">Login</h2>
        <p className="mb-6 text-sm text-center text-gray-500">
          Welcome back! Please log in to access your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your Email"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#820D17] focus:ring-2 focus:ring-[#820D17]/30"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your Password"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#820D17] focus:ring-2 focus:ring-[#820D17]/30"
            />
          </div>

          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
