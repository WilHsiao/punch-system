// */punch-system/query-self-data

'use client';
import React, { useState, useEffect } from 'react';
import { auth, database } from '@/config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { get, ref, query, orderByChild } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function QueryPunch() {
    const [user, setUser] = useState(null);
    const [punches, setPunches] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser ? currentUser : null);
        });

        return () => unsubscribe();
    }, []);

    const handleQuery = async () => {
        if (!user) {
            toast.error('用戶未登入！', { autoClose: 2000 });
            return;
        }

        const uid = user.uid;

        try {
            const punchesQuery = query(
                ref(database, `punches/${uid}`),
                orderByChild('timestamp')
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
            <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
                <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-700 text-center mb-6">【 我的紀錄 】</h1>
                    <button
                        onClick={handleQuery}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg w-full font-bold mb-6 transition duration-300 ease-in-out"
                    >
                        查詢
                    </button>
                    {punches.length > 0 && (
                        <div className="w-full mt-4">
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg shadow-lg">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                            <th className="py-3 px-6 text-left">日期和時間</th>
                                            <th className="py-3 px-6 text-left">打卡類型</th>
                                            <th className="py-3 px-6 text-left">備註</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700 text-sm font-light">
                                        {punches.map((punch, index) => {
                                            const prevPunch = index > 0 ? punches[index - 1] : null;
                                            const isOrderIncorrect = prevPunch && prevPunch.type === punch.type;

                                            return (
                                                <React.Fragment key={punch.timestamp}>
                                                    {isOrderIncorrect && (
                                                        <tr className="bg-yellow-100">
                                                            <td colSpan="3" className="py-2 px-6 text-center text-yellow-700">
                                                                警告：連續的{punch.type}打卡可能有誤
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr
                                                        className={`border-b border-gray-200 hover:bg-gray-100 font-semibold ${punch.type === '上班' ? 'bg-green-100' : 'bg-red-100'
                                                            }`}
                                                    >
                                                        <td className="py-3 px-6 text-left whitespace-nowrap">{punch.timestamp}</td>
                                                        <td className="py-3 px-6 text-left">{punch.type}</td>
                                                        <td className="py-3 px-6 text-left">{punch.tag}</td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </>
    );
}
