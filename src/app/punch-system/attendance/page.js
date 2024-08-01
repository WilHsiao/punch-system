// /punch-sysetm/attendance

'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, database } from '@/config/firebaseConfig';

export default function AttendanceCheck() {
  const [attendance, setAttendance] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 獲取用戶的完整信息，包括 dept
        get(ref(database, `users/${user.uid}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              setCurrentUser({ uid: user.uid, ...snapshot.val() });
            } else {
              setError("User data not found");
            }
          })
          .catch((error) => setError("Failed to fetch user data: " + error.message))
          .finally(() => setLoading(false));
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkAttendance = async () => {
    console.log("Checking attendance..."); // 添加日誌
    if (!currentUser) {
      setError("Please log in to check attendance");
      return;
    }

    if (!currentUser.dept) {
      setError("User department not found");
      return;
    }

    try {
      setError(null);

      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);

      const users = [];
      usersSnapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.dept === currentUser.dept) {
          users.push({ uid: childSnapshot.key, ...userData });
        }
      });

      console.log("Users in department:", users); // 添加日誌

      const attendanceData = await Promise.all(users.map(async (user) => {
        const punchRef = ref(database, `punches/${user.uid}`);
        const punchSnapshot = await get(punchRef);
        let latestPunch = null;
        punchSnapshot.forEach((childSnapshot) => {
          const punchData = childSnapshot.val();
          if (!latestPunch || punchData.timestamp > latestPunch.timestamp) {
            latestPunch = { id: childSnapshot.key, ...punchData };
          }
        });
        return {
          ...user,
          status: latestPunch && latestPunch.type === '上班' ? '在分部' : '不在'
        };
      }));

      console.log("Attendance data:", attendanceData); // 添加日誌
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Detailed error:", error);
      setError("Failed to check attendance: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
          <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
              <h1 className="text-2xl font-bold">載入中...</h1>
          </div>
      </div>
  );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
          <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
              <h1 className="text-2xl font-bold">請先登入</h1>
          </div>
      </div>
  );
  }

  return (
    <>
      <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
        <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">【 分部人員狀況 】</h1>
          <button
            onClick={checkAttendance}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg w-full font-bold mb-6 transition duration-300 ease-in-out"
          >
            查詢
          </button>
          {attendance.length > 0 && (
            <div className="space-y-4">
              {['在分部', '不在'].map(status => {
                const usersWithStatus = attendance.filter(user => user.status === status);
                if (usersWithStatus.length === 0) return null;

                return (
                  <div key={status} className={`p-4 rounded-lg ${status === '在分部' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h2 className={`text-lg font-semibold mb-2 ${status === '在分部' ? 'text-green-800' : 'text-red-800'}`}>
                      {status} ({usersWithStatus.length})
                    </h2>
                    <ul className="space-y-2">
                      {usersWithStatus.map(user => (
                        <li
                          key={user.uid}
                          className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center"
                        >
                          <span className="font-medium">{user.name}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            status === '在分部' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}