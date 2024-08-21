'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { database } from '@/config/firebaseConfig';
import { set, ref, get, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { useIamAccess } from '@/hooks/iam-access';

const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function Punch() {
      const { isAuthorized, isLoading, userRole } = useIamAccess(['打卡機'], []);
      const [name, setName] = useState('');
      const [uid, setUid] = useState('');
      const [scanning, setScanning] = useState(false);
      const [punchType, setPunchType] = useState(() => {
            return typeof window !== 'undefined' ? localStorage.getItem('punchType') || '' : '';
      });
      const lastScanTime = useRef(Date.now());
      const isProcessing = useRef(false);

      useEffect(() => {
            const savedPunchType = localStorage.getItem('punchType');
            if (savedPunchType) {
                  setPunchType(savedPunchType);
            }
      }, []);

      const handleScan = useCallback(async (data) => {
            if (data && !isProcessing.current) {
                  isProcessing.current = true;
                  setScanning(false);
                  console.log("QR Code detected: ", data.text);
                  setUid(data.text);

                  try {
                        const userRef = ref(database, `users/${data.text}`);
                        const userSnapshot = await get(userRef);
                        if (userSnapshot.exists()) {
                              const userData = userSnapshot.val();
                              setName(userData.name);
                        } else {
                              toast.error('用戶不存在！', { autoClose: 2000 });
                        }
                  } catch (error) {
                        console.error("Error fetching user data: ", error);
                        toast.error('獲取用戶數據時出錯', { autoClose: 2000 });
                  } finally {
                        isProcessing.current = false;
                        lastScanTime.current = Date.now();
                  }
            }
      }, []);

      const handleError = useCallback((err) => {
            console.error("QR Reader Error: ", err);
            toast.error(`掃描 QR Code 失敗: ${err}`, { autoClose: 2000 });
      }, []);

      const handlePunch = async () => {
            if (!uid || !name) {
                  toast.error('請確保 UID 和姓名欄位都已填寫', { autoClose: 2000 });
                  return;
            }

            if (punchType === '') {
                  toast.error('請選擇打卡類型！', { autoClose: 2000 });
                  return;
            }

            const currentHour = new Date().getHours();
            if ((currentHour < 10 && punchType === '下班') || (currentHour >= 20 && punchType === '上班')) {
                  if (!window.confirm('確定要在這個時間打卡嗎？')) {
                        return;
                  }
            }

            try {
                  const punchesQuery = query(ref(database, `punches/${uid}`), orderByChild('timestamp'), limitToLast(1));
                  const punchesSnapshot = await get(punchesQuery);
                  if (punchesSnapshot.exists()) {
                        const lastPunch = Object.values(punchesSnapshot.val())[0];
                        const lastPunchTime = new Date(lastPunch.timestamp);
                        const now = new Date();

                        if ((now - lastPunchTime) < 5 * 60 * 1000) {
                              toast.error('重複打卡，請稍後再試！', { autoClose: 2000 });
                              return;
                        }
                  }

                  const punchData = { timestamp: serverTimestamp(), type: punchType };
                  const punchRef = ref(database, `punches/${uid}/${new Date().toISOString().replace(/\W/g, '')}`);
                  await set(punchRef, punchData);
                  console.log("Punch recorded successfully.");
                  toast.success(`${name} 打卡成功！`, { autoClose: 2000 });

                  await sendLineNotify(uid, name, punchType);

            } catch (error) {
                  console.error("Error handling punch: ", error);
                  toast.error('打卡過程出現錯誤，請向管理員反映！', { autoClose: 2000 });
            }
      };

      const handlePunchTypeChange = (type) => {
            setPunchType(type);
            localStorage.setItem('punchType', type);
      };

      // const resetScanner = () => {
      //       setScanning(false);
      //       setTimeout(() => setScanning(true), 100);
      // };

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
                              <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 打卡機 】</h1>
                              <div className="mb-6 w-full flex justify-center">
                                    <div className="grid grid-cols-2 gap-4">
                                          {['上班', '下班'].map((type) => (
                                                <button
                                                      key={type}
                                                      className={`px-6 py-3 rounded-lg transition-colors duration-300 ${punchType === type
                                                                  ? 'bg-blue-600 text-white'
                                                                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                                            }`}
                                                      onClick={() => handlePunchTypeChange(type)}
                                                >
                                                      {type}
                                                </button>
                                          ))}
                                    </div>
                              </div>
                              <div className="flex justify-center items-center w-full mb-4">
                                    {scanning ? (
                                          <div className="w-full h-full">
                                                <QrReader
                                                      key={Date.now()}
                                                      delay={300}
                                                      onError={handleError}
                                                      onScan={handleScan}
                                                      style={{ width: '100%', height: '100%' }}
                                                />
                                          </div>
                                    ) : (
                                          <button
                                                onClick={() => setScanning(true)}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-transform transform hover:scale-105 shadow-lg"
                                          >
                                                開啟 QRcode 掃描器
                                          </button>
                                    )}
                              </div>
                              <div className="mb-4 flex flex-col">
                                    <input
                                          type="text"
                                          id="uid"
                                          value={uid}
                                          onChange={(e) => setUid(e.target.value)}
                                          placeholder="請輸入UID"
                                          className="p-3 border border-gray-300 text-gray-800 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                              </div>
                              <div className="mb-6 flex flex-col">
                                    <input
                                          type="text"
                                          id="name"
                                          value={name}
                                          onChange={(e) => setName(e.target.value)}
                                          placeholder="請輸入姓名"
                                          className="p-3 border border-gray-300 text-gray-800 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                              </div>
                              <div className="mb-6">
                                    <button
                                          onClick={handlePunch}
                                          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300"
                                    >
                                          打卡去！
                                    </button>
                              </div>
                        </div>
                  </div>
                  <ToastContainer />
            </>

      );
}