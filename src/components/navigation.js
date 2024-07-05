import Link from 'next/link';

export default function Navigation(){
  return (
    <>
      <nav className="w-full bg-gray-400 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a className="text-lg font-bold">首頁</a>
          </Link>
          <div className="flex space-x-4">
            <Link href="/punch" legacyBehavior>
              <a className="text-lg font-bold">[打卡]</a>
            </Link>
            <Link href="/add-new-users" legacyBehavior>
              <a className="text-lg font-bold">[新增使用者]</a>
            </Link>
          </div>
        </div>
      </nav>
    </>
    );
}