// @/hooks/iam-access.js

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/config/firebaseConfig';

export function useIamAccess(allowedRoles = ['admin'], excludedRoles = []) {
    // eg. const { isAuthorized, isLoading, userRole } = useIamAccess(['adminC'], ['usersE', 'admin']);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = ref(database, `users/${user.uid}`);
                const userSnapshot = await get(userRef);
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.val();
                    setUserRole(userData.role);

                    // 檢查授權
                    if (allowedRoles.length === 0 && excludedRoles.length === 0) {
                    // 如果沒有指定任何角色，則只允許 admin
                    setIsAuthorized(userData.role === 'admin');
                    } else if (allowedRoles.length > 0) {
                    // 如果指定了允許的角色，則檢查用戶是否在允許列表中
                    setIsAuthorized(allowedRoles.includes(userData.role));
                    } else {
                    // 如果只指定了排除的角色，則檢查用戶是否不在排除列表中
                    setIsAuthorized(!excludedRoles.includes(userData.role));
                    }
                } else {
                  setIsAuthorized(false);
                }
            } else {
                setIsAuthorized(false);
                setUserRole(null);
              }
              setIsLoading(false);
            });

            return () => unsubscribe();
    }, [allowedRoles, excludedRoles]);

    return { isAuthorized, isLoading, userRole };
}
