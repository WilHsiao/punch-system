'use client';

import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function Dashboard() {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserRole = async (user) => {
            if (user) {
                const userRef = ref(database, 'users/' + user.uid);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    setRole(snapshot.val().role);
                } else {
                    console.log('No such document!');
                }
            }
            setLoading(false);
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserRole(user);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div>載入中...</div>;
    }

    return (
        <div>
            {role === 'admin' ? (
                <div>管理員界面內容</div>
            ) : (
                <div>一般會員界面內容</div>
            )}
        </div>
    );
}
