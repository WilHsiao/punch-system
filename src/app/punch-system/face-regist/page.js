'use client';
import React, { useState, useRef, useEffect } from 'react';
import { database, storage } from '@/config/firebaseConfig';
import { ref as dbRef, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import * as faceapi from 'face-api.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useIamAccess } from '@/hooks/iam-access';

export default function FaceRegistration() {
    const { isAuthorized, isLoading } = useIamAccess(['打卡機'], []);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [name, setName] = useState('');
    const [uid, setUid] = useState('');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [showMedia, setShowMedia] = useState(false);
    const [isUsingCamera, setIsUsingCamera] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const streamRef = useRef(null);

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

    const findUidByName = async (name) => {
        const usersRef = dbRef(database, 'users');
        const nameQuery = query(usersRef, orderByChild('name'), equalTo(name));
        const snapshot = await get(nameQuery);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            const uid = Object.keys(userData)[0];
            return uid;
        } else {
            return null;
        }
    };

    const handleNameChange = (e) => {
        setName(e.target.value);
        setUid('');
    };

    const handleSearch = async () => {
        if (!name) {
            toast.error('請輸入姓名');
            return;
        }

        setIsSearching(true);
        try {
            const foundUid = await findUidByName(name);
            if (foundUid) {
                setUid(foundUid);
                toast.success('搜尋 UID 成功！', { autoClose: 1000 });
            } else {
                setUid('');
                toast.warn('找不到對應的UID', { autoClose: 1000 });
            }
        } catch (error) {
            console.error('Error searching for UID:', error);
            toast.error('搜尋UID時發生錯誤', { autoClose: 1000 });
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('無法開啟鏡頭');
        }
    };

    const stopVideo = () => {
        if (streamRef.current) {
            const tracks = streamRef.current.getTracks();
            tracks.forEach(track => track.stop());
            streamRef.current = null;
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
        setIsUsingCamera(false);
        setShowMedia(false);
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
        if (!uid) {
            toast.error('無法找到對應的UID，請確認姓名是否正確');
            return;
        }

        if (!showMedia) {
            toast.error('請先開啟鏡頭或上傳照片');
            return;
        }

        setIsProcessing(true);
        toast.info('正在處理，請稍候...', { autoClose: 2000 });

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
            toast.error('請確保鏡頭已啟動或照片已上傳');
            setIsProcessing(false);
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
                const imageRef = storageRef(storage, `face_images/${uid}.jpg`);
                await uploadString(imageRef, imageDataUrl, 'data_url');
                const imageUrl = await getDownloadURL(imageRef);

                // 獲取現有的用戶數據
                const userRef = dbRef(database, `users/${uid}`);
                const snapshot = await get(userRef);
                const existingData = snapshot.val() || {};

                // 合併現有數據與新的人臉識別數據
                const updatedData = {
                    ...existingData,
                    name: name,
                    faceDescriptor: faceDescriptor,
                    imageUrl: imageUrl
                };
                // 保存更新後的用戶數據到 Realtime Database
                await set(userRef, updatedData);

                toast.dismiss();
                toast.success('人臉註冊成功！');

                // 如果使用鏡頭，註冊成功後關閉
                if (isUsingCamera) {
                    stopVideo();
                    setIsUsingCamera(false);
                    setShowMedia(false);
                }
            } else {
                toast.error('未檢測到人臉，請確保照片中有清晰的人臉');
            }
        } catch (error) {
            console.error('Error processing image:', error);
            toast.error('處理圖像時出錯');
        } finally {
            setIsProcessing(false);
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
        <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
            <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">【 人臉註冊 】</h1>
                <div className="mb-6 w-full">
                    <div className="flex items-center">
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            onKeyPress={handleKeyPress}
                            placeholder="請輸入姓名，以搜尋UID"
                            className="flex-grow p-3 border border-gray-300 text-gray-800 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !name}
                            className={`ml-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 whitespace-nowrap ${(isSearching || !name) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSearching ? '搜尋中...' : '搜尋'}
                        </button>
                    </div>
                </div>
                {uid && (
                    <div className="mb-6 text-center">
                        <p className="w-full text-md text-green-600 font-semibold bg-green-100 px-4 py-2 rounded-lg inline-block">
                            UID: <span className="face-reg-text font-bold text-green-800">{uid}</span>
                        </p>
                    </div>
                )}
                <div className="mb-6">
                    <button
                        onClick={captureAndRegister}
                        disabled={isProcessing || !uid}
                        className={`w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 ${(isProcessing || !uid) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isProcessing ? '處理中...' : '註冊'}
                    </button>
                </div>
                <div className="mb-6 flex justify-center space-x-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="face-reg-btn px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-colors duration-300"
                    >
                        上傳照片
                    </button>
                    {!isUsingCamera ? (
                        <button
                            onClick={handleCameraClick}
                            className="face-reg-btn px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors duration-300"
                        >
                            開啟鏡頭
                        </button>
                    ) : (
                        <button
                            onClick={stopVideo}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
                        >
                            關閉鏡頭
                        </button>
                    )}
                </div>
                {showMedia && (
                    <div className="relative w-full mb-6">
                        {uploadedImage ? (
                            <img src={uploadedImage} alt="Uploaded" className="w-full h-auto rounded-lg" />
                        ) : (
                            <video ref={videoRef} className="w-full h-auto rounded-lg" autoPlay muted playsInline />
                        )}
                        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}