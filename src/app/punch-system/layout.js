// Punch system layout

export const metadata = {
  title: "打卡系統",
  description: "我是打卡系統我是打卡系統我是打卡系統",
};

export default function PunchSystemLayout({ children }) {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <header className="bg-gray-100 py-2">
        </header>
        <main className="flex-grow py-8">
          <div className="max-w-5xl mx-auto px-4">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
