'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { database } from '@/config/firebaseConfig';
import { set, ref, get, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as faceapi from 'face-api.js';

const loadModels = async () => {
    const MODEL_URL = '/models';
    try {
        await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
        await faceapi.loadFaceLandmarkModel(MODEL_URL);
        await faceapi.loadFaceRecognitionModel(MODEL_URL);
        return true;
    } catch (error) {
        console.error('Error loading face-api models:', error);
        toast.error('無法載入人臉識別模型');
        return false;
    }
};

const FacialRecognitionPunch = () => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [punchType, setPunchType] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('punchType') || '上班' : '上班');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const lastDetectionTime = useRef(Date.now());
    const isProcessing = useRef(false);
    const detectFacesRef = useRef(null);

    useEffect(() => {
        const initialize = async () => {
            const modelLoaded = await loadModels();
            setIsModelLoaded(modelLoaded);
        };

        initialize();

        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
            detectFacesRef.current && cancelAnimationFrame(detectFacesRef.current);
        };
    }, []);

    useEffect(() => {
        if (isModelLoaded) {
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

            startVideo();

            const handleVideoPlay = () => {
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
                            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
                            if (detections.length > 0) {
                                isProcessing.current = true;
                                lastDetectionTime.current = now;

                                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                                faceapi.draw.drawDetections(canvas, resizedDetections);

                                const matchedUser = await matchFaceWithDatabase(resizedDetections[0].descriptor);
                                matchedUser ? await handlePunch(matchedUser.uid) : toast.error('未識別的用戶');

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

            videoRef.current.addEventListener('play', handleVideoPlay);
            return () => videoRef.current?.removeEventListener('play', handleVideoPlay);
        }
    }, [isModelLoaded]);

    const matchFaceWithDatabase = async (faceDescriptor) => {
        const usersSnapshot = await get(ref(database, 'users'));
        const users = usersSnapshot.val();

        for (const [uid, userData] of Object.entries(users)) {

            // 調整數值 -> 0.6 ，越低標準越嚴格
            if (userData.faceDescriptor && faceapi.euclideanDistance(faceDescriptor, userData.faceDescriptor) < 0.6) {
                return { uid, ...userData };
            }
        }
        return null;
    };

    const handlePunchTypeChange = (type) => {
        setPunchType(type);
        localStorage.setItem('punchType', type);
        toast.info(`已切換到${type}打卡模式`, { autoClose: 1000 });
    };

    const handlePunch = async (uid) => {
        try {
            const currentHour = new Date().getHours();
            const currentPunchType = punchType;
            if ((currentHour < 10 && currentPunchType === '下班') || (currentHour >= 20 && currentPunchType === '上班')) {
                if (!window.confirm('確定要在這個時間打卡嗎？')) return;
            }

            const userRef = ref(database, `users/${uid}`);
            const userSnapshot = await get(userRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                const now = Date.now();

                const punchesQuery = query(ref(database, `punches/${uid}`), orderByChild('timestamp'), limitToLast(1));
                const punchesSnapshot = await get(punchesQuery);
                if (punchesSnapshot.exists()) {
                    const lastPunchTime = new Date(Object.values(punchesSnapshot.val())[0].timestamp);
                    if ((now - lastPunchTime) < 5 * 60 * 1000) {
                        toast.error('重複打卡，請稍後再試！', { autoClose: 1500 });
                        return;
                    }
                }

                const punchRef = ref(database, `punches/${uid}/${new Date().toISOString().replace(/\W/g, '')}`);
                await set(punchRef, { timestamp: serverTimestamp(), type: currentPunchType });
                toast.success(`${userData.name} ${currentPunchType}打卡成功！`, { autoClose: 1500 });
            } else {
                toast.error('用戶不存在！', { autoClose: 1500 });
            }
        } catch (error) {
            console.error("Error handling punch: ", error);
            toast.error('打卡過程出現錯誤！', { autoClose: 1500 });
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
            <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 人臉識別打卡 】</h1>
                <div className="mb-3 w-full flex flex-col items-center">
                    <div className="flex space-x-4">
                        {['上班', '下班'].map(type => (
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