// */punch-system/query-student-data

'use client';
import { useState } from 'react';
import { database } from '@/config/firebaseConfig';
import { get, ref, query, orderByChild } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { useIamAccess } from '@/hooks/iam-access';

const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function QueryPunch() {
    const { isAuthorized, isLoading, userRole } = useIamAccess(['主管', '老師'], []);
    const [punches, setPunches] = useState([]);
    const [scanning, setScanning] = useState(true);
    const [lastScanned, setLastScanned] = useState(null);
    const [inputUid, setInputUid] = useState('');

    const handleScan = async (data) => {
        if (data && data !== lastScanned) {
            const uid = typeof data === 'object' ? data.text : data;
            setLastScanned(data);
            setScanning(false);
            await queryPunches(uid);
        }
    };

    const queryPunches = async (uid) => {
        try {
            // 首先檢查被查詢的用戶是否為學生
            const userRef = ref(database, `users/${uid}`);
            const userSnapshot = await get(userRef);

            if (!userSnapshot.exists()) {
                toast.error('找不到該用戶！', { autoClose: 2000 });
                setPunches([]);
                return;
            }

            const userData = userSnapshot.val();
            if (userData.role !== '學生') {
                toast.error('只能查詢學生的打卡記錄！', { autoClose: 2000 });
                setPunches([]);
                return;
            }

            // 如果是學生，則繼續查詢打卡記錄
            const punchesQuery = query(
                ref(database, `punches/${uid}`),
                orderByChild('timestamp'),
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

    const handleError = (err) => {
        console.error(err);
        toast.error('QR碼掃描錯誤', { autoClose: 2000 });
    };

    const handleInputChange = (e) => {
        setInputUid(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputUid.trim()) {
            setScanning(false);
            queryPunches(inputUid.trim());
            setInputUid('');
        } else {
            toast.error('請輸入有效的 UID', { autoClose: 2000 });
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
            <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
                <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 查詢學生報到記錄 】</h1>

                    {/* UID 輸入區塊 */}
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={inputUid}
                                onChange={handleInputChange}
                                placeholder="輸入 UID"
                                className="flex-grow p-2 border rounded-l"
                            />
                            <button
                                type="submit"
                                className="bg-blue-500 text-white p-2 rounded-r"
                            >
                                查詢
                            </button>
                        </div>
                    </form>

                    {/* QrCode 輸入區塊 */}
                    {scanning ? (
                        <div className="w-full">
                            <QrReader
                                delay={300}
                                onError={handleError}
                                onScan={handleScan}
                                style={{ width: '100%' }}
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setScanning(true);
                                setLastScanned(null);
                                setInputUid('');
                            }}
                            className="bg-green-500 text-white p-2 rounded w-full font-bold mt-2"
                        >
                            重新掃描
                        </button>
                    )}
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
                                                <>
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
                                                </>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <ToastContainer />
            </div>
        </>
    );
}