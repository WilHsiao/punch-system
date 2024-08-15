'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { database } from '@/config/firebaseConfig';
import { set, ref, get, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as faceapi from 'face-api.js';

const FacialRecognitionPunch = () => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [punchType, setPunchType] = useState(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('punchType') || '上班' : '上班';
    });
    const punchTypeRef = useRef(punchType);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const lastDetectionTime = useRef(Date.now());
    const isProcessing = useRef(false);
    const detectFacesRef = useRef(null);

    useEffect(() => {
        punchTypeRef.current = punchType;
    }, [punchType]);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
                await faceapi.loadFaceLandmarkModel(MODEL_URL);
                await faceapi.loadFaceRecognitionModel(MODEL_URL);
                setIsModelLoaded(true);
            } catch (error) {
                console.error('Error loading face-api models:', error);
                toast.error('無法載入人臉識別模型');
            }
        };

        loadModels();

        // 清理函數
        return () => {
            if (streamRef.current) {
                const tracks = streamRef.current.getTracks();
                tracks.forEach(track => track.stop());
            }
            if (detectFacesRef.current) {
                cancelAnimationFrame(detectFacesRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isModelLoaded) {
            startVideo();
        }
    }, [isModelLoaded]);

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('無法訪問攝像頭');
        }
    };

    const handleVideoPlay = useCallback(() => {
        if (isModelLoaded && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = faceapi.createCanvasFromMedia(video);
            canvasRef.current.appendChild(canvas);
            const displaySize = { width: video.width, height: video.height };
            faceapi.matchDimensions(canvas, displaySize);

            const detectFaces = async () => {
                if (!video || video.paused || video.ended) {
                    detectFacesRef.current = requestAnimationFrame(detectFaces);
                    return;
                }

                const now = Date.now();
                if (now - lastDetectionTime.current > 1500 && !isProcessing.current) {
                    try {
                        const detections = await faceapi.detectAllFaces(video)
                            .withFaceLandmarks()
                            .withFaceDescriptors();
                        
                        if (detections.length > 0) {
                            isProcessing.current = true;
                            lastDetectionTime.current = now;
                            const resizedDetections = faceapi.resizeResults(detections, displaySize);
                            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                            faceapi.draw.drawDetections(canvas, resizedDetections);

                            const faceDescriptor = resizedDetections[0].descriptor;
                            const matchedUser = await matchFaceWithDatabase(faceDescriptor);
                            if (matchedUser) {
                                await handlePunch(matchedUser.uid);
                            } else {
                                toast.error('未識別的用戶');
                            }

                            setTimeout(() => {
                                isProcessing.current = false;
                            }, 1500);
                        }
                    } catch (error) {
                        console.error('Face detection error:', error);
                    }
                }
                detectFacesRef.current = requestAnimationFrame(detectFaces);
            };

            detectFaces();
        }
    }, [isModelLoaded]);

    useEffect(() => {
        if (isModelLoaded && videoRef.current) {
            videoRef.current.addEventListener('play', handleVideoPlay);
            return () => {
                if (videoRef.current) {
                    videoRef.current.removeEventListener('play', handleVideoPlay);
                }
            };
        }
    }, [isModelLoaded, handleVideoPlay]);

    const matchFaceWithDatabase = async (faceDescriptor) => {
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);
        const users = usersSnapshot.val();

        for (const [uid, userData] of Object.entries(users)) {
            if (userData.faceDescriptor) {
                const distance = faceapi.euclideanDistance(faceDescriptor, userData.faceDescriptor);
                if (distance < 0.6) {
                    return { uid, ...userData };
                }
            }
        }
        return null;
    };

    const handlePunchTypeChange = useCallback((type) => {
        setPunchType(type);
        localStorage.setItem('punchType', type);
        toast.info(`已切換到${type}打卡模式`, { autoClose: 1000 });
    }, []);

    const handlePunch = async (uid) => {
        try {
            const currentPunchType = punchTypeRef.current;
            const currentHour = new Date().getHours();
    
            // 特殊打卡時間再次確認
            if ((currentHour < 10 && currentPunchType === '下班') || (currentHour >= 20 && currentPunchType === '上班')) {
                if (!window.confirm('確定要在這個時間打卡嗎？')) {
                    return;
                }
            }
    
            const userRef = ref(database, `users/${uid}`);
            const userSnapshot = await get(userRef);
    
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                const now = Date.now();
    
                // 不能五分鐘內重複打卡
                const punchesQuery = query(ref(database, `punches/${uid}`), orderByChild('timestamp'), limitToLast(1));
                const punchesSnapshot = await get(punchesQuery);
                if (punchesSnapshot.exists()) {
                    const lastPunch = Object.values(punchesSnapshot.val())[0];
                    const lastPunchTime = new Date(lastPunch.timestamp);
    
                    if ((now - lastPunchTime) < 5 * 60 * 1000) {
                        toast.error('重複打卡，請稍後再試！', { autoClose: 2000 });
                        return;
                    }
                }
    
                // 繼續執行打卡
                const punchData = { timestamp: serverTimestamp(), type: currentPunchType };
                const punchRef = ref(database, `punches/${uid}/${new Date().toISOString().replace(/\W/g, '')}`);
                await set(punchRef, punchData);
    
                toast.success(`${userData.name} ${currentPunchType}打卡成功！`, { autoClose: 2000 });
            } else {
                toast.error('用戶不存在！', { autoClose: 2000 });
            }
        } catch (error) {
            console.error("Error handling punch: ", error);
            toast.error('打卡過程出現錯誤！', { autoClose: 2000 });
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
            <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 人臉識別打卡 】</h1>
                <div className="mb-3 w-full flex flex-col items-center">
                    <div className="flex space-x-4">
                        {['上班', '下班'].map((type) => (
                            <button
                                key={type}
                                className={`px-4 py-2 rounded ${punchType === type ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                                onClick={() => handlePunchTypeChange(type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center items-center w-full">
                    <video ref={videoRef} width="720" height="560" autoPlay muted playsInline />
                    <canvas ref={canvasRef} style={{ position: 'absolute' }} />
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default FacialRecognitionPunch;
