// src/app/punch

'use client';
import { useState, useRef, useEffect } from 'react';
import { set, ref, get, serverTimestamp } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { database } from '@/config/firebaseConfig';
import Navigation from '@/components/navigation';

// 動態加載 QrReader 組件，只在客戶端渲染
const QrReader = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function Punch() {
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [name, setName] = useState('');
    const [uid, setUid] = useState('');
    const [scanning, setScanning] = useState(true);
    const lastScanTime = useRef(Date.now());
    const isProcessing = useRef(false);

    useEffect (() => {
        return () => {
            isProcessing.current = false;
        };
    }, []);


    const handleScan = async (data) => {
        const now = Date.now();
        if (data && now - lastScanTime.current > 2000 && !isProcessing.current) {
            isProcessing.current = true;
            console.log("QR Code detected: ", data.text);
            setUid(data.text);
            setScanning(false);
            await handlePunch(data.text);
            lastScanTime.current = now;
            setTimeout(() => {
                isProcessing.current = false;
            }, 2000);
        }
    };

    const handleError = (err) => {
        console.error("QR Reader Error: ", err);
        toast.error(`掃描 QR Code 失敗: ${err}`);
    };

    const handlePunch = async (uid) => {
        try {
            const userRef = ref(database, `users/${uid}`);
            const userSnapshot = await get(userRef);
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                setName(userData.name);

                const punchData = { timestamp: serverTimestamp() };
                const punchRef = ref(database, `users/${uid}/punches/${new Date().toISOString().replace(/\W/g, '')}`);
                await set(punchRef, punchData);
                console.log("Punch recorded successfully.");
                toast.success(`${userData.name} 打卡成功！`);
            } else {
                toast.error('用戶不存在！');
            }

            setButtonDisabled(false);
            setTimeout(() => {
                setScanning(true);
            }, 3000);

        } catch (error) {
            console.error("Error handling punch: ", error);
            toast.error('打卡過程出現錯誤');
        } finally {
            setButtonDisabled(false);
            setTimeout(() => {
                setScanning(true);
            }, 3000);
        }
    };

    return (
        <>
            <Navigation />
            <div>
                {scanning && (
                    <QrReader
                        delay={300}
                        onError={handleError}
                        onScan={handleScan}
                        style={{ width: '100%' }}
                    />
                )}
            </div>
            <ToastContainer />
        </>
    );
}

