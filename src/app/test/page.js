'use client';
import { useState, useEffect } from 'react';
import { database, auth } from '@/config/firebaseConfig';
import { ref, set, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useIamAccess } from '@/hooks/iam-access';

export default function PunchManual() {
  const { isAuthorized, isLoading } = useIamAccess();
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [punchType, setPunchType] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('管理員已授權');
      } else {
        toast.error('請通知管理員進行授權！', { autoClose: 3000 });
      }
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${year}年${month}月${day}日`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}時${minutes}分`;
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setTime(e.target.value);
  };

  const handleManualPunch = async () => {
    if (!uid || !date || !time || !punchType) {
      toast.error('請完整填寫所有欄位！', { autoClose: 3000 });
      return;
    }

    try {
      const punchTimestamp = new Date(`${date}T${time}`).getTime();
      const userRef = ref(database, `users/${uid}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        setName(userData.name);

        const punchData = {
          timestamp: punchTimestamp,
          type: punchType,
          tag: "補打卡"
        };
        const punchRef = ref(database, `punches/${uid}/${new Date(punchTimestamp).toISOString().replace(/\W/g, '')}`);
        await set(punchRef, punchData);
        console.log("Punch recorded successfully.");
        toast.success(`${userData.name} 的補打卡成功！`, { autoClose: 1000 });
        setUid('');
        setTime('');
        setDate('');
        setPunchType('');
      } else {
        toast.error('用戶不存在！', { autoClose: 1000 });
      }
    } catch (error) {
      console.error("Error handling manual punch: ", error);
      toast.error('補打卡過程出現錯誤', { autoClose: 1000 });
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">載入中...</h1>
    </div>;
  }

  if (!isAuthorized) {
    return <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">管理員須先授權！</h1>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-semibold">【 補打卡 】</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input
                    type="text"
                    id="uid"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                    placeholder="請輸入用戶 UID"
                  />
                  <label htmlFor="uid" className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">UID</label>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={handleDateChange}
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 appearance-none"
                  />
                  <label htmlFor="date" className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all">日期</label>
                  {date && <div className="mt-1 text-sm text-gray-500">{formatDate(date)}</div>}
                </div>
                <div className="relative">
                  <input
                    type="time"
                    id="time"
                    value={time}
                    onChange={handleTimeChange}
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 appearance-none"
                  />
                  <label htmlFor="time" className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all">時間</label>
                  {time && <div className="mt-1 text-sm text-gray-500">{formatTime(time)}</div>}
                </div>
                <div className="relative">
                  <div className="flex justify-between">
                    <button
                      onClick={() => setPunchType('上班')}
                      className={`px-4 py-2 rounded ${punchType === '上班' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      上班
                    </button>
                    <button
                      onClick={() => setPunchType('下班')}
                      className={`px-4 py-2 rounded ${punchType === '下班' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      下班
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={handleManualPunch}
                    className="bg-blue-500 text-white rounded-md px-2 py-1 w-full"
                  >
                    提交補打卡
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}