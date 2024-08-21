'use client';
import React, { useState, useRef, useEffect } from 'react';
import { database, storage } from '@/config/firebaseConfig';
import { ref as dbRef, set, get } from 'firebase/database';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import * as faceapi from 'face-api.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function FaceRegistration() {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [userName, setUserName] = useState('');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [showMedia, setShowMedia] = useState(false);
    const [isUsingCamera, setIsUsingCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

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

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImage(e.target.result);
                setShowMedia(true);
                setIsUsingCamera(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraClick = () => {
        setIsUsingCamera(true);
        setUploadedImage(null);
        setShowMedia(true);
        startVideo();
    };

    const captureAndRegister = async () => {
        if (!userName) {
            toast.error('請輸入用戶名');
            return;
        }

        if (!showMedia) {
            toast.error('請先開啟鏡頭或上傳照片');
            return;
        }

        let imageElement;
        if (uploadedImage) {
            imageElement = new Image();
            imageElement.src = uploadedImage;
            await new Promise((resolve) => {
                imageElement.onload = resolve;
            });
        } else if (videoRef.current) {
            imageElement = videoRef.current;
        } else {
            toast.error('請確保攝像頭已啟動或照片已上傳');
            return;
        }

        try {
            const detections = await faceapi.detectSingleFace(imageElement).withFaceLandmarks().withFaceDescriptor();

            if (detections) {
                const faceDescriptor = Array.from(detections.descriptor);

                // 創建 canvas 並繪製圖像
                const canvas = faceapi.createCanvasFromMedia(imageElement);
                const context = canvas.getContext('2d');
                context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg');

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
            } else {
                toast.error('未檢測到人臉，請確保照片中有清晰的人臉');
            }
        } catch (error) {
            console.error('Error processing image:', error);
            toast.error('處理圖像時出錯');
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-start">
            <h1 className="text-2xl font-bold mb-4">人臉註冊</h1>
            <div>
            <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="輸入用戶名"
                className="mb-4 p-2 border rounded"
            />
            <button
                onClick={captureAndRegister}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
                註冊人臉
            </button>
            </div>
            <div className="mb-4 flex space-x-4">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    上傳照片
                </button>
                <button
                    onClick={handleCameraClick}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    開啟鏡頭
                </button>
            </div>
            {showMedia && (
                <div className="relative">
                    {uploadedImage ? (
                        <img src={uploadedImage} alt="Uploaded" width="720" height="560" />
                    ) : (
                        <video ref={videoRef} width="720" height="560" autoPlay muted playsInline />
                    )}
                    <canvas ref={canvasRef} className="absolute top-0 left-0" />
                </div>
            )}
            <ToastContainer />
        </div>
    );
}