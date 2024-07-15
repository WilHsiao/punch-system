// */punch-system/query-punch-data

'use client';
import { useState } from 'react';
import { database } from '@/config/firebaseConfig';
import { get, ref, query, orderByChild, startAt, endAt } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function QueryPunch() {
    const [uid, setUid] = useState('');
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [punches, setPunches] = useState([]);

    const handleQuery = async () => {
        if (uid.trim() === '' || year.trim() === '' || month.trim() === '') {
            toast.error('請輸入 UID、年份和月份！', { autoClose: 2000 });
            return;
        }

        const startTimestamp = new Date(`${year}-${month}-01`).getTime();
        const endTimestamp = new Date(year, month, 0, 23, 59, 59).getTime();

        try {
            const punchesQuery = query(
                ref(database, `punches/${uid}`),
                orderByChild('timestamp'),
                startAt(startTimestamp),
                endAt(endTimestamp)
            );

            const punchesSnapshot = await get(punchesQuery);
            if (punchesSnapshot.exists()) {
                const punchesData = Object.values(punchesSnapshot.val()).map(punch => ({
                    ...punch,
                    timestamp: new Date(punch.timestamp).toLocaleString()
                }));
                setPunches(punchesData);
            } else {
                toast.error('沒有找到打卡記錄！', { autoClose: 2000 });
                setPunches([]);
            }
        } catch (error) {
            console.error("Error querying punches: ", error);
            toast.error('查詢過程出現錯誤', { autoClose: 2000 });
            setPunches([]);
        }
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center justify-center space-y-6 p-8 bg-white rounded-lg shadow-lg w-full max-w-md"
                style={{ marginTop: '-30%' }}
                >
                    <h1 className="text-2xl font-bold text-gray-700">查詢特定月份打卡記錄</h1>
                    <input
                        type="text"
                        placeholder="輸入 UID"
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full"
                    />
                    <input
                        type="text"
                        placeholder="輸入年份 (YYYY)"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full mt-2"
                    />
                    <input
                        type="text"
                        placeholder="輸入月份 (MM)"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full mt-2"
                    />
                    <button
                        onClick={handleQuery}
                        className="bg-blue-500 text-white p-2 rounded w-full font-bold mt-2"
                    >
                        查詢
                    </button>
                    {punches.length > 0 && (
                        <div className="w-full mt-4">
                            <h2 className="text-xl font-bold text-gray-700 mb-2">打卡記錄</h2>
                            <ul className="list-disc list-inside">
                                {punches.map((punch, index) => (
                                    <li key={index} className="text-gray-700">
                                        {punch.timestamp} - {punch.type}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
