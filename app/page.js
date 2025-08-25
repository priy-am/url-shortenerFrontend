"use client";
import { useEffect, useState } from "react";
import {
  Copy,
  Link,
  ExternalLink,
  Eye,
  Clock,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';

export default function Home() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  const [longUrl, setLongUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  // const { toast } = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/url/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to shorten URL");
      setResult(data);
      console.log("short url", data);
    } catch (err) {
      setError(err.message);
    }
  };

  const copy = async () => {
    if (result?.shortUrl) await navigator.clipboard.writeText(result.shortUrl);
    toast.success("Copied to clipboard!", { position: "top-center", autoClose: 2000 });
  };

  const fetchAdmin = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/url/admin/urls`, {
        headers: { "x-admin-token": ADMIN_TOKEN },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unauthorized");
      setList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const redirect = async (shortUrlOrCode) => {
  try {
    const code = shortUrlOrCode.includes("/")
      ? shortUrlOrCode.split("/").filter(Boolean).pop()
      : shortUrlOrCode;

    // optimistic UI update: bump clicks locally
    setResult((prev) => {
      if (!prev) return prev;
      const matches = prev.code === code || prev.shortUrl?.endsWith(code);
      if (!matches) return prev;
      const updated = { ...prev, clicks: (prev.clicks || 0) + 1 };
      localStorage.setItem("lastShort", JSON.stringify(updated));
      return updated;
    });

    // also update admin list if loaded
    setList((prev) =>
      prev.map((u) =>
        (u.code === code || u.shortUrl?.endsWith(code))
          ? { ...u, clicks: (u.clicks || 0) + 1 }
          : u
      )
    );

    // open the short URL — let the browser follow the 302
    window.open(`${API_BASE}/api/url/${code}`, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.log(error);
  }
};



  // restore last shortened URL on page load
useEffect(() => {
  const last = localStorage.getItem("lastShort");
  if (last) setResult(JSON.parse(last));
}, []);


  return (
    <>
    <ToastContainer />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <Link className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                URL Shortener
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your long URLs into short, shareable links with
              beautiful analytics and tracking.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
            <div className="text-center p-6 pb-0">
              <h2 className="text-2xl font-semibold flex items-center justify-center gap-2 text-gray-800">
                <Sparkles className="w-6 h-6 text-blue-600" />
                Create Short Link
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <form
                onSubmit={onSubmit}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-1">
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/some/very/long/path"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    className="w-full text-base px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:w-auto w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Shortening...
                    </div>
                  ) : (
                    "Shorten URL"
                  )}
                </button>
              </form>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {result && (
                <div className="p-6 rounded-2xl border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="text-sm text-gray-500 font-medium">
                        Your short URL
                      </div>
                      <div
                        className="text-xl font-semibold text-blue-600 hover:text-blue-800 transition-colors break-all flex items-center gap-2 cursor-pointer"
                        onClick={() => redirect(result.shortUrl)}
                      >
                        {result.shortUrl}
                        <ExternalLink className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Original:</span>{" "}
                        {result.longUrl}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.clicks}
                        </div>
                        <div className="text-xs text-gray-500">Clicks</div>
                      </div>
                      <button
                        onClick={copy}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Section */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAdmin((s) => !s);
                    if (!showAdmin) fetchAdmin();
                  }}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  {showAdmin ? "Hide" : "Show"} Admin Analytics Dashboard
                </button>

                {showAdmin && (
                  <div className="mt-6 p-6 rounded-2xl bg-gray-50 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                      <Eye className="w-5 h-5" />
                      URL Analytics
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b border-gray-300">
                            <th className="p-3 font-semibold text-gray-700">
                              Short URL
                            </th>
                            <th className="p-3 font-semibold text-gray-700">
                              Original URL
                            </th>
                            <th className="p-3 font-semibold text-center text-gray-700">
                              Clicks
                            </th>
                            <th className="p-3 font-semibold text-gray-700">
                              Created
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((u) => (
                            <tr
                              key={u._id}
                              className="border-b border-gray-200 hover:bg-white/80 transition-colors"
                            >
                              <td className="p-3">
                                <div
                                  onClick={() => redirect(u.shortUrl)}
                                  // target="_blank"
                                  // rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {u.shortUrl.split("//").pop()}
                                  <ExternalLink className="w-3 h-3" />
                                </div>
                              </td>
                              <td
                                className="p-3 max-w-[20rem] truncate text-gray-600"
                                title={u.longUrl}
                              >
                                {u.longUrl}
                              </td>
                              <td className="p-3 text-center">
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {u.clicks}
                                  <BarChart3 className="w-3 h-3" />
                                </span>
                              </td>
                              <td className="p-3 text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>Powered by modern web technologies • Fast • Reliable • Secure</p>
          </div>
        </div>
      </div>
    </>
  );
}
