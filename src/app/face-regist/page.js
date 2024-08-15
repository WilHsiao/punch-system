'use client';
import { useState, useRef, useEffect } from 'react';
import { database, storage } from '@/config/firebaseConfig';
import { ref as dbRef, set, get } from 'firebase/database';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import * as faceapi from 'face-api.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function FaceRegistration() {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [userName, setUserName] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

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
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('無法訪問攝像頭');
        }
    };

    const captureAndRegister = async () => {
        if (!userName) {
            toast.error('請輸入用戶名');
            return;
        }

        if (videoRef.current && canvasRef.current) {
            const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

            if (detections) {
                const faceDescriptor = Array.from(detections.descriptor);

                // 捕獲當前圖片
                const canvas = faceapi.createCanvasFromMedia(videoRef.current);
                const context = canvas.getContext('2d');
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg');

                try {
                    // 上傳圖片到 Firebase Storage
                    const imageRef = storageRef(storage, `face_images/${userName}.jpg`);
                    await uploadString(imageRef, imageDataUrl, 'data_url');
                    const imageUrl = await getDownloadURL(imageRef);

                    // 獲取現有的用戶數據
                    const userRef = dbRef(database, `users/${userName}`);
                    const snapshot = await get(userRef);
                    const existingData = snapshot.val() || {};

                    // 合併現有數據與新的人臉識別數據
                    const updatedData = {
                        ...existingData,
                        faceDescriptor: faceDescriptor,
                        imageUrl: imageUrl
                    };
                    // 保存更新後的用戶數據到 Realtime Database
                    await set(userRef, updatedData);

                    toast.success('人臉註冊成功！');
                } catch (error) {
                    console.error('Error saving to Firebase:', error);
                    toast.error('保存數據時出錯');
                }
            } else {
                toast.error('未檢測到人臉，請確保您的臉在攝像頭範圍內');
            }
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-start">
            <h1 className="text-2xl font-bold mb-4">人臉註冊</h1>
            <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="輸入用戶名"
                className="mb-4 p-2 border rounded"
            />
            <div className="relative">
                <video ref={videoRef} width="720" height="560" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="absolute top-0 left-0" />
            </div>
            <button
                onClick={captureAndRegister}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                註冊人臉
            </button>
            <ToastContainer />
        </div>
    );
}