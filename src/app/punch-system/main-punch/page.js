'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { database } from '@/config/firebaseConfig';
import { set, ref, get, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { useIamAccess } from '@/hooks/iam-access';
import * as faceapi from 'face-api.js';

const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false });

const sendEmailNotification = async (uid, name, punchType, currentUserDept) => {
    try {
        console.log('==== 開始發送郵件通知 ====');
        console.log('參數:', { uid, name, punchType, currentUserDept });

        // 1. 嘗試獲取用戶資料
        const userRef = ref(database, `users/${uid}`);
        console.log('獲取用戶資料，路徑:', `users/${uid}`);
        
        try {
            const userSnapshot = await get(userRef);
            console.log('用戶快照獲取結果:', userSnapshot.exists() ? '存在' : '不存在');
            
            if (!userSnapshot.exists()) {
                throw new Error('找不到該用戶資料');
            }
            
            const userData = userSnapshot.val();
            console.log('用戶資料:', JSON.stringify(userData, null, 2));
            
            const userEmail = userData.email;
            console.log('用戶郵件:', userEmail);
            
            if (!userEmail) {
                throw new Error('找不到用戶電子郵件地址');
            }
            
            // 2. 準備郵件內容
            let punchMessage;
            if (punchType === '上班') {
                punchMessage = `抵達 <${currentUserDept}>分部`;
            } else if (punchType === '下班') {
                punchMessage = `離開 <${currentUserDept}>分部`;
            } else {
                punchMessage = `${punchType}${currentUserDept}分部`;
            }
            
            const subject = `打卡通知: ${name} ${punchType}`;
            const text = `${name}已於 ${new Date().toLocaleString()} ${punchMessage}`;
            console.log('準備發送郵件:', { to: userEmail, subject, text });
            
            toast.success(`郵件將發送到: ${userEmail}`, { autoClose: 1500 });
            
        
            // 3. 發送郵件
            console.log('開始調用郵件 API');
            const response = await fetch('/api/send-email-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: userEmail,
                    subject: subject,
                    text: text
                })
            });
            
            console.log('API 回應狀態:', response.status);
            
            // 4. 處理回應
            const responseText = await response.text();
            console.log('API 回應內容:', responseText);
            
            if (!response.ok) {
                throw new Error(`API 回應錯誤 (${response.status}): ${responseText}`);
            }
            
            console.log('==== 郵件發送成功 ====');
            
            
        } catch (userError) {
            console.error('獲取用戶資料出錯:', userError);
            throw userError;
        }
    } catch (error) {
        console.error('==== 發送郵件通知時出錯 ====', error);
        console.error('錯誤堆疊:', error.stack);
        toast.error(`郵件通知發送失敗: ${error.message}`, { autoClose: 3000 });
    }
};

const loadModels = async () => {
    const MODEL_URL = '/models';
    try {
        await Promise.all([
            faceapi.loadSsdMobilenetv1Model(MODEL_URL),
            faceapi.loadFaceLandmarkModel(MODEL_URL),
            faceapi.loadFaceRecognitionModel(MODEL_URL)
        ]);
        return true;
    } catch (error) {
        console.error('Error loading face-api models:', error);
        toast.error('無法載入人臉識別模型');
        return false;
    }
};

export default function Punch() {
    const { isAuthorized, isLoading } = useIamAccess(['打卡機'], []);
    const [name, setName] = useState('');
    const [uid, setUid] = useState('');
    const [scanning, setScanning] = useState(false);
    const [punchType, setPunchType] = useState(() => localStorage.getItem('punchType') || '');
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isPunchSuccessful, setIsPunchSuccessful] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    const lastScanTime = useRef(Date.now());
    const isProcessing = useRef(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const detectFacesRef = useRef(null);

    useEffect(() => {
        loadModels().then(setIsModelLoaded);
        return () => stopVideoStream();
    }, []);

    useEffect(() => {
        if (isModelLoaded && isCameraActive) {
            startVideo();
        }
    }, [isModelLoaded, isCameraActive]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // 用戶已登錄，獲取額外的用戶信息
                try {
                    const userRef = ref(database, `users/${user.uid}`);
                    const snapshot = await get(userRef);

                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        setCurrentUser({ ...user, ...userData });
                    } else {
                        console.error('找不到用戶附加資料');
                        toast.error('無法獲取完整的用戶資料', { autoClose: 1500 });
                    }
                } catch (error) {
                    console.error('獲取用戶資料時出錯:', error);
                    toast.error('獲取用戶資料失敗，請稍後再試', { autoClose: 1500 });
                }
            } else {
                // 用戶未登錄
                setCurrentUser(null);
                toast.error('請先登錄', { autoClose: 3000 });
            }
        });

        // 清理函數
        return () => unsubscribe();
    }, []);

    const handleScan = useCallback(async (data) => {
        if (data && !isProcessing.current) {
            isProcessing.current = true;
            setScanning(false);
            const scannedUid = String(data.text);
            setUid(scannedUid);

            try {
                const userRef = ref(database, `users/${scannedUid}`);
                const userSnapshot = await get(userRef);
                if (userSnapshot.exists()) {
                    setName(userSnapshot.val().name);
                    toast.success('QR code 辨識成功，已填入 UID 和姓名', { autoClose: 1500 });
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

    const handlePunch = async () => {
        try {
            if (!uid || !name || punchType === '') {
                throw new Error('請確保 UID、姓名和打卡類型都已填寫');
            }

            const sanitizedUid = String(uid).trim();
            if (!sanitizedUid) {
                throw new Error('無效的 UID：空字符串');
            }

            const punchesQuery = query(ref(database, `punches/${sanitizedUid}`), orderByChild('timestamp'), limitToLast(1));
            const punchesSnapshot = await get(punchesQuery);
            if (punchesSnapshot.exists()) {
                const lastPunch = Object.values(punchesSnapshot.val())[0];
                const lastPunchTime = new Date(lastPunch.timestamp);
                if ((new Date() - lastPunchTime) < 5 * 60 * 1000) {
                    throw new Error('重複打卡，請稍後再試');
                }
            }

            const currentHour = new Date().getHours();
            if ((punchType === '下班' && currentHour < 8) || (punchType === '上班' && currentHour >= 20)) {
                const message = punchType === '下班' ? '您正在早上8點前進行"下班"打卡，是否確定？' : '您正在晚上8點後進行"上班"打卡，是否確定？';
                setConfirmationMessage(message);
                setShowConfirmation(true);
                return;
            }

            await executePunch();

        } catch (error) {
            console.error("處理打卡時出錯: ", error);
            toast.error(`打卡過程出現錯誤：${error.message}`, { autoClose: 2000 });
        }
    };

    const executePunch = async () => {
        const punchData = { timestamp: serverTimestamp(), type: punchType };
        const punchRef = ref(database, `punches/${uid}/${new Date().toISOString().replace(/\W/g, '')}`);

        await set(punchRef, punchData);
        toast.success(`${name} 打卡成功！`, { autoClose: 2000 });

        // 這裡替換為發送郵件通知
        await sendEmailNotification(uid, name, punchType, currentUser?.dept || '未知');

        setUid('');
        setName('');
        setIsPunchSuccessful(true);
        stopVideoStream();
    };

    // 移除原先的generateQRCodeURL函數，新增設置電子郵件函數
    const setupEmailNotification = async () => {
        if (!uid) {
            toast.error('請先輸入UID', { autoClose: 2000 });
            return;
        }
        
        try {
            const userRef = ref(database, `users/${uid}`);
            const userSnapshot = await get(userRef);
            
            if (!userSnapshot.exists()) {
                toast.error('用戶不存在！', { autoClose: 2000 });
                return;
            }
            
            // 這裡可以加入彈出視窗讓用戶輸入或確認電子郵件
            const userData = userSnapshot.val();
            const currentEmail = userData.email || '';
            
            // 使用簡單提示輸入
            const newEmail = prompt('請輸入接收打卡通知的電子郵件地址:', currentEmail);
            
            if (newEmail && newEmail.includes('@')) {
                // 更新用戶的電子郵件
                await set(ref(database, `users/${uid}/email`), newEmail);
                toast.success('郵件通知設置成功！', { autoClose: 2000 });
            } else if (newEmail !== null) {
                toast.error('請輸入有效的電子郵件地址', { autoClose: 2000 });
            }
        } catch (error) {
            console.error('設置郵件通知時出錯:', error);
            toast.error(`設置郵件通知失敗: ${error.message}`, { autoClose: 2000 });
        }
    };

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    startFaceDetection();
                };
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('無法訪問攝像頭');
            setIsCameraActive(false);
        }
    };

    const startFaceDetection = () => {
        const video = videoRef.current;
        const canvas = faceapi.createCanvasFromMedia(video);
        canvasRef.current.appendChild(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        const detectFaces = async () => {
            if (!video || video.paused || video.ended || isPunchSuccessful || !isCameraActive) return;

            const now = Date.now();
            if (now - lastScanTime.current > 1500 && !isProcessing.current) {
                try {
                    const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
                    if (detections.length > 0) {
                        isProcessing.current = true;
                        lastScanTime.current = now;

                        const resizedDetections = faceapi.resizeResults(detections, displaySize);
                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                        faceapi.draw.drawDetections(canvas, resizedDetections);

                        const matchedUser = await matchFaceWithDatabase(resizedDetections[0].descriptor);
                        if (matchedUser) {
                            setUid(matchedUser.uid);
                            setName(matchedUser.name);
                            toast.success('人臉辨識成功，已填入 UID 和姓名', { autoClose: 1500 });
                            stopVideoStream();
                            setIsPunchSuccessful(true);
                        } else {
                            toast.error('未識別的用戶');
                        }

                        setTimeout(() => isProcessing.current = false, 1500);
                    }
                } catch (error) {
                    console.error('Face detection error:', error);
                }
            }
            detectFacesRef.current = requestAnimationFrame(detectFaces);
        };

        detectFaces();
    };

    const stopVideoStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (detectFacesRef.current) {
            cancelAnimationFrame(detectFacesRef.current);
        }
        setIsCameraActive(false);
    };

    const matchFaceWithDatabase = async (faceDescriptor) => {
        const usersSnapshot = await get(ref(database, 'users'));
        const users = usersSnapshot.val();

        for (const [uid, userData] of Object.entries(users)) {
            if (userData.faceDescriptor && faceapi.euclideanDistance(faceDescriptor, userData.faceDescriptor) < 0.4) {
                return { uid, ...userData };
            }
        }
        return null;
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
        <div className="min-h-screen py-2 px-4 flex flex-col items-start justify-start">
            <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 打卡機 】</h1>
                <div className="mb-6 w-full flex justify-center">
                    <div className="grid grid-cols-2 gap-4">
                        {['上班', '下班'].map((type) => (
                            <button
                                key={type}
                                className={`px-6 py-3 rounded-lg transition-colors duration-300 ${punchType === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                                onClick={() => {
                                    setPunchType(type);
                                    localStorage.setItem('punchType', type);
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center items-center w-full mb-4">
                    {scanning ? (
                        <div className='w-full'>
                            <div className="w-full h-full">
                                <QrReader
                                    key={Date.now()}
                                    delay={300}
                                    onError={(err) => {
                                        console.error("QR Reader Error: ", err);
                                        toast.error(`掃描 QR Code 失敗: ${err}`, { autoClose: 2000 });
                                    }}
                                    onScan={handleScan}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                            <button
                                onClick={() => setScanning(false)}
                                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 mt-2"
                            >
                                關閉掃描器
                            </button>
                        </div>
                    ) : isCameraActive ? (
                        <div className='w-full'>
                            <div className="relative w-full h-full">
                                <video ref={videoRef} width="720" height="560" autoPlay muted playsInline />
                                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                            </div>
                            <button
                                onClick={() => {
                                    setIsCameraActive(false);
                                    stopVideoStream();
                                }}
                                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 mt-2"
                            >
                                關閉掃描器
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-4">
                            <button
                                onClick={() => setScanning(true)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-700 hover:to-green-700 hover:scale-105 shadow-lg"
                            >
                                QRcode 掃描
                            </button>
                            <button
                                onClick={() => {
                                    if (isModelLoaded) {
                                        setIsPunchSuccessful(false);
                                        setIsCameraActive(true);
                                    } else {
                                        toast.error('模型尚未加載完成，請稍後再試');
                                    }
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 hover:scale-105 shadow-lg"
                            >
                                人臉辨識掃描
                            </button>
                        </div>
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
                {showConfirmation && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                        <div className="bg-white p-5 rounded-lg shadow-xl">
                            <h2 className="text-xl font-bold mb-4">確認打卡</h2>
                            <p className="mb-4">{confirmationMessage}</p>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmation(false);
                                        executePunch();
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    確認打卡
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="mb-4 flex flex-col space-y-2">
                    <button
                        onClick={setupEmailNotification}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
                    >
                        設置郵件通知
                    </button>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}