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
                console.log('管理員已登入');
            } else {
                toast.error('請前往管理員專區登入！', { autoClose: 3000 });
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
            <div
            className="flex flex-col items-center justify-center space-y-6 p-8 bg-white rounded-lg shadow-lg w-full max-w-xl"
            style={{ marginTop: '-30%' }}
            >
              <h1 className="text-2xl font-bold text-gray-700">【 補打卡 】</h1>
              <div className="flex flex-col items-center w-full max-w-md">
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="請輸入用戶 UID"
                  className="mb-4 px-4 py-2 border border-gray-300 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mb-4 px-4 py-2 border border-gray-300 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mb-4 px-4 py-2 border border-gray-300 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <label htmlFor="punchType" className="font-medium text-gray-700 font-bold">打卡類型:</label>
                  <div className="flex items-center p-2 border border-gray-300 rounded space-x-4">
                    <div className="flex items-center text-gray-700 font-bold">
                      <input
                        type="radio"
                        id="punchTypeStart"
                        name="punchType"
                        value="上班"
                        checked={punchType === "上班"}
                        onChange={(e) => setPunchType(e.target.value)}
                        className="form-radio"
                      />
                      <label htmlFor="punchTypeStart" className="ml-2">上班</label>
                    </div>
                    <div className="flex items-center text-gray-700 font-bold">
                      <input
                        type="radio"
                        id="punchTypeEnd"
                        name="punchType"
                        value="下班"
                        checked={punchType === "下班"}
                        onChange={(e) => setPunchType(e.target.value)}
                        className="form-radio"
                      />
                      <label htmlFor="punchTypeEnd" className="ml-2">下班</label>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleManualPunch}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
                >
                  提交補打卡
                </button>
              </div>
            </div>
          </div>
          <ToastContainer />
        </>

    );
}
