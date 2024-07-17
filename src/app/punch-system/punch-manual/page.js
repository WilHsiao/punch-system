// */punch-system/punch-manual

'use client';
import { useState, useEffect } from 'react';
import { database, auth } from '@/config/firebaseConfig';
import { ref, set, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PasswordUnlock from '@/hooks/page-pw-unlock';

export default function PunchManual() {
    const [uid, setUid] = useState('');
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [punchType, setPunchType] = useState('');
    const [unlocked, setUnlocked] = useState(false); // 用於控制是否解鎖

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
            } else {
                toast.error('用戶不存在！', { autoClose: 1000 });
            }
        } catch (error) {
            console.error("Error handling manual punch: ", error);
            toast.error('補打卡過程出現錯誤', { autoClose: 1000 });
        }
    };

    if (!unlocked) {
        return <PasswordUnlock onUnlock={() => setUnlocked(true)} />; // 顯示密碼解鎖頁面
    }

    return (
        <>
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center justify-center space-y-6 p-8 bg-white rounded-lg shadow-lg w-full max-w-xl mt-[-30%]">
              <h1 className="text-2xl font-bold text-gray-700">【 補打卡 】</h1>
              {[
                { label: 'UID', type: 'text', value: uid, onChange: setUid, placeholder: '請輸入用戶 UID' },
                { label: '日期', type: 'date', value: date, onChange: setDate },
                { label: '時間', type: 'time', value: time, onChange: setTime }
              ].map(({ label, type, value, onChange, placeholder }, idx) => (
                <div key={idx} className="mb-3 w-full flex items-center">
                  <h2 className="w-1/5 text-left text-gray-700 font-bold pr-4">{label}</h2>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="p-2 border border-gray-300 text-gray-700 rounded w-full"
                  />
                </div>
              ))}
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
              <button
                onClick={handleManualPunch}
                className="w-3/5 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
              >
                提交補打卡
              </button>
            </div>
          </div>
          <ToastContainer />
        </>
    );
}
