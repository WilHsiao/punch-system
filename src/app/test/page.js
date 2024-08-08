// 查看目前資料
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { database } from '@/config/firebaseConfig';

// 定義任務屬性及其顯示名稱
const taskProperties = [
      { key: 'quest-time', label: '提出時間' },
      { key: 'category', label: '分類' },
      { key: 'main', label: '教材名' },
      { key: 'tag', label: '版本' },
      { key: 'form', label: '教用/學用' },
      { key: 'number', label: '數量' },
      { key: 'deadline', label: 'Deadline' },
      { key: 'additional', label: '備註' },
      { key: 'state', label: '目前狀態' },
      { key: 'update-time', label: '最後更新' }
];

// 任務詳情行組件
const TaskDetailRow = ({ label, value, isEven }) => (
      <tr className={isEven ? 'bg-gray-100' : ''}>
            <td className="py-2 px-3 font-semibold">{label}</td>
            <td className="py-2 px-3">{value}</td>
      </tr>
);

// 任務卡片組件
const TaskCard = ({ task }) => (
      <li className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-lg mb-3">{task.main}</h3>
            <table className="w-full text-sm">
                  <tbody>
                        {taskProperties.map((prop, index) => (
                              <TaskDetailRow
                                    key={prop.key}
                                    label={prop.label}
                                    value={task[prop.key]}
                                    isEven={index % 2 === 0}
                              />
                        ))}
                  </tbody>
            </table>
      </li>
);

export default function TasksPage() {
      const [tasks, setTasks] = useState({});
      const [userDept, setUserDept] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
            const auth = getAuth();
            onAuthStateChanged(auth, (user) => {
                  if (user) {
                        // 用戶已登錄，獲取用戶部門
                        const userRef = ref(database, `users/${user.uid}`);
                        onValue(userRef, (snapshot) => {
                              const userData = snapshot.val();
                              if (userData && userData.dept) {
                                    setUserDept(userData.dept);
                                    // 獲取該部門的任務
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
                        // 用戶未登錄，重置狀態
                        setUserDept(null);
                        setTasks({});
                        setLoading(false);
                  }
            });
      }, []);

      if (loading) {
            return <div className="container mx-auto px-4 py-8">Loading...</div>;
      }

      if (!userDept) {
            return <div className="container mx-auto px-4 py-8">Please log in to view tasks.</div>;
      }

      return (
            <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold mb-6">Tasks for {userDept}</h1>
                  {Object.keys(tasks).length === 0 ? (
                        <p>No tasks found for your department.</p>
                  ) : (
                        <ul className="space-y-6  text-black">
                              {Object.entries(tasks).map(([taskId, task]) => (
                                    <TaskCard key={taskId} task={task} />
                              ))}
                        </ul>
                  )}
            </div>
      );
}