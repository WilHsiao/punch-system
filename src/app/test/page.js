import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceRecognitionClockIn = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error(err));
  };

  const handleRecognize = async () => {
    if (!isRecognizing) {
      setIsRecognizing(true);
      startVideo();
    } else {
      setIsRecognizing(false);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }
  };

  const recognize = async () => {
    if (videoRef.current && canvasRef.current) {
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptors();

      // Here you would compare the detected face with your database
      // For demonstration, we'll just log the detections
      console.log(detections);

      // Draw detections
      const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
      faceapi.matchDimensions(canvasRef.current, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
    }
  };

  useEffect(() => {
    let interval;
    if (isRecognizing) {
      interval = setInterval(recognize, 100);
    }
    return () => clearInterval(interval);
  }, [isRecognizing]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">員工人臉辨識打卡</h1>
      <div className="relative">
        <video ref={videoRef} autoPlay muted className="rounded-lg shadow-lg" />
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>
      <button
        onClick={handleRecognize}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {isRecognizing ? '停止辨識' : '開始辨識'}
      </button>
    </div>
  );
};

export default FaceRecognitionClockIn;