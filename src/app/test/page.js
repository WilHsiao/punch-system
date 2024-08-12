'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { database } from '@/config/firebaseConfig';

const taskProperties = [
      { key: 'category', label: '分類' },
      { key: 'main', label: '教材名' },
      { key: 'tag', label: '版本' },
      { key: 'form', label: '教用/學用' },
      { key: 'number', label: '數量' },
      { key: 'deadline', label: '最後期限' },
      { key: 'additional', label: '備註' },
      { key: 'quest-time', label: '提出時間' },
      { key: 'update-time', label: '最後更新' },
];

const statusColors = {
      '收到訂單': 'bg-blue-500',
      '向分部確認中': 'bg-yellow-500',
      '製作中': 'bg-orange-500',
      '已向廠商訂購': 'bg-purple-500',
      '等待寄件': 'bg-indigo-500',
      '寄送中': 'bg-green-500',
      '等待取件': 'bg-teal-500',
      '取件完成': 'bg-gray-500',
};

const StatusButton = ({ status }) => {
      const colorClass = statusColors[status] || 'bg-gray-500';
      return (
            <button
                  className={`${colorClass} text-white font-bold py-2 px-4 rounded-full`}
                  disabled
            >
                  {status}
            </button>
      );
};

export default function ViewTasksPage() {
      const [tasks, setTasks] = useState({});
      const [userDept, setUserDept] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
            const auth = getAuth();
            onAuthStateChanged(auth, (user) => {
                  if (user) {
                        const userRef = ref(database, `users/${user.uid}`);
                        onValue(userRef, (snapshot) => {
                              const userData = snapshot.val();
                              if (userData && userData.dept) {
                                    setUserDept(userData.dept);
                                    const tasksRef = ref(database, `tasks/${userData.dept}`);
                                    onValue(tasksRef, (snapshot) => {
                                          const data = snapshot.val();
                                          setTasks(data || {});
                                          setLoading(false);
                                    });
                              } else {
                                    setLoading(false);
                              }
                        });
                  } else {
                        setUserDept(null);
                        setTasks({});
                        setLoading(false);
                  }
            });
      }, []);

      if (loading) {
            return (
                  <div className="flex min-h-screen flex-col items-center justify-between p-24">
                        <div className="flex flex-col items-center justify-start h-1/3 w-full max-w-5xl font-mono text-sm text-center">
                              <h1 className="text-2xl font-bold">載入中...</h1>
                        </div>
                  </div>
            );
      }

      if (!userDept) {
            return <div className="container mx-auto px-4 py-8">請登入帳號以查看教材需求表</div>;
      }

      return (
            <div className="min-h-screen py-10 px-4 flex flex-col items-start justify-start">
                  <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-8">
                        <h1 className="text-3xl font-bold mb-6">教材需求表 - 【{userDept}】</h1>
                        {Object.keys(tasks).length === 0 ? (
                              <p>No tasks found for your department.</p>
                        ) : (
                              <ul className="space-y-6">
                                    {Object.entries(tasks).map(([taskId, task]) => (
                                          <li key={taskId} className="bg-gray-50 p-4 rounded-lg border-solid border-2 border-black">
                                                <h3 className="text-2xl text-center font-bold mb-4 text-black-700 border-b-2 border-blue-900 pb-2">
                                                      &lt;&lt;&nbsp;&nbsp;&nbsp;{task.category}&nbsp;&nbsp;&nbsp;&gt;&gt;
                                                </h3>
                                                <div className="mb-4">
                                                      <StatusButton status={task.state} />
                                                </div>
                                                <table className="w-full text-sm mb-4 text-black">
                                                      <tbody>
                                                            {taskProperties.map((prop, index) => (
                                                                  <tr key={prop.key} className={index % 2 === 0 ? 'bg-gray-200' : ''}>
                                                                        <td className="py-2 px-3 font-semibold">{prop.label}</td>
                                                                        <td className="py-2 px-3">{task[prop.key]}</td>
                                                                  </tr>
                                                            ))}
                                                      </tbody>
                                                </table>
                                          </li>
                                    ))}
                              </ul>
                        )}
                  </div>
            </div>
      );
}