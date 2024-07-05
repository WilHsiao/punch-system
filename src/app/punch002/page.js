// src/app/punch002   電腦外接掃碼器！！！
// src/app/punch

'use client';
import { useState, useRef, useEffect } from 'react';
import { set, ref, get, serverTimestamp } from 'firebase/database';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { database } from '@/config/firebaseConfig';
import Navigation from '@/components/navigation';

export default function Punch() {
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [name, setName] = useState('');
    const [uid, setUid] = useState('');
    const lastScanTime = useRef(Date.now());
    const isProcessing = useRef(false);
    const barcodeData = useRef('');

    useEffect(() => {
        const handleKeydown = (event) => {
            if (event.key === 'Enter') {
                const now = Date.now();
                if (barcodeData.current && now - lastScanTime.current > 2000 && !isProcessing.current) {
                    isProcessing.current = true;
                    handleBarcodeScan(barcodeData.current);
                    barcodeData.current = '';
                    lastScanTime.current = now;
                    setTimeout(() => {
                        isProcessing.current = false;
                    }, 2000);
                }
            } else {
                barcodeData.current += event.key;
            }
        };

        window.addEventListener('keydown', handleKeydown);

        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    }, []);

    const handleBarcodeScan = async (barcode) => {
        console.log("Barcode detected: ", barcode);
        setUid(barcode);
        await handlePunch(barcode);
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
        } catch (error) {
            console.error("Error handling punch: ", error);
            toast.error('打卡過程出現錯誤');
        } finally {
            setButtonDisabled(false);
        }
    };

    return (
        <>
            <Navigation />
            <div>
                <p>{name ? `${name} 打卡成功！` : '請掃描條碼'}</p>
            </div>
            <ToastContainer />
        </>
    );
}
