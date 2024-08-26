'use client';
import { useState, useEffect, useRef } from 'react';
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
  const [displayDate, setDisplayDate] = useState('');
  const [time, setTime] = useState('');
  const [displayTime, setDisplayTime] = useState('');
  const [punchType, setPunchType] = useState('');
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

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
    const newDate = e.target.value;
    setDate(newDate);
    setDisplayDate(formatDate(newDate));
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTime(newTime);
    setDisplayTime(formatTime(newTime));
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
        setDisplayTime('');
        setDate('');
        setDisplayDate('');
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
    return (
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
          <h1 className="text-2xl font-bold">載入中...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
          <h1 className="text-2xl font-bold">管理員須先授權！</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-start">
        <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-700 text-center pb-3">【 補打卡 】</h1>
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
                </div>
                <div className="relative">
                <div className="mb-3 w-full flex flex-col items-center">
            <label className="text-gray-700 font-bold mb-2">打卡類型</label>
            <div className="flex space-x-4">
              {['上班', '下班'].map((type) => (
                <button
                  key={type}
                  className={`px-4 py-2 rounded ${punchType === type ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                  onClick={() => setPunchType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
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
      <ToastContainer />
    </>
  );
}