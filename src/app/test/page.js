'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const SimplifiedFaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      await tf.ready();
      const loadedModel = await blazeface.load();
      setModel(loadedModel);
      console.log("Model loaded successfully");
    };

    loadModel();
  }, []);

  const startVideo = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing the camera:", err);
      }
    }
  };

  const detectFaces = async () => {
    if (model && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const predictions = await model.estimateFaces(video, false);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      predictions.forEach(prediction => {
        const start = prediction.topLeft;
        const end = prediction.bottomRight;
        const size = [end[0] - start[0], end[1] - start[1]];

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(start[0], start[1], size[0], size[1]);
      });
    }
  };

  const toggleDetection = () => {
    if (!isDetecting) {
      startVideo();
      setIsDetecting(true);
    } else {
      setIsDetecting(false);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }
  };

  useEffect(() => {
    let detectionInterval;
    if (isDetecting && model) {
      detectionInterval = setInterval(detectFaces, 100);
    }
    return () => clearInterval(detectionInterval);
  }, [isDetecting, model]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">簡化版人臉檢測</h1>
      <div className="relative">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className="rounded-lg shadow-lg"
          width={640}
          height={480}
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0"
          width={640}
          height={480}
        />
      </div>
      <button
        onClick={toggleDetection}
        disabled={!model}
        className={`mt-4 px-4 py-2 ${model ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400'} text-white rounded transition-colors`}
      >
        {isDetecting ? '停止檢測' : '開始檢測'}
      </button>
      {!model && <p className="mt-2 text-red-500">正在加載模型，請稍候...</p>}
    </div>
  );
};

export default SimplifiedFaceDetection;