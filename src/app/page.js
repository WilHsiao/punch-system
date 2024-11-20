// Web App Home Page

export default function Home() {
  const navLinks = [
    { title: '首頁', path: '/' },
    { title: '登入 / 登出', path: '/login' },
    { title: '分部需求表', path: '/tasks' },
  ];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="w-full py-12 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
            【翰霖】ERP 系統
          </h1>
          <p className="text-xl text-center text-gray-600">
            企業資源管理
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navLinks.map((link, index) => (
            <a
              key={index}
              href={link.path}
              className="block p-6 bg-white rounded-lg shadow-md hover:bg-blue-300 transition-all duration-300"
            >
              <h2 className="text-xl font-semibold text-center">
                {link.title}
              </h2>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}