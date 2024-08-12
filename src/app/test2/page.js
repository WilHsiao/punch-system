'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
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
      { key: 'state', label: '目前狀態' },
      { key: 'quest-time', label: '提出時間' },
      { key: 'update-time', label: '最後更新' },
];

const TaskEditForm = ({ task, onSave, onCancel }) => {
      const [editedTask, setEditedTask] = useState(task);

      const handleChange = (key, value) => {
            if (key === 'number') {
                  value = value === '' ? '' : Math.floor(Number(value));
            }
            setEditedTask(prev => ({ ...prev, [key]: value }));
      };

      const handleSubmit = (e) => {
            e.preventDefault();
            onSave({
                  id: editedTask.id,
                  number: editedTask.number,
                  deadline: editedTask.deadline
            });
      };

      return (
            <form onSubmit={handleSubmit} className="space-y-4 text-black">
                  {taskProperties.map(prop => (
                        <div key={prop.key} className="flex flex-col">
                              <label className="font-semibold">{prop.label}</label>
                              {prop.editable ? (
                                    <input
                                          type={prop.type}
                                          value={editedTask[prop.key]}
                                          onChange={(e) => handleChange(prop.key, e.target.value)}
                                          className="border p-2 rounded"
                                          step={prop.type === 'number' ? 1 : undefined}
                                    />
                              ) : (
                                    <p className="p-2">{task[prop.key]}</p>
                              )}
                        </div>
                  ))}
                  <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">取消</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">保存</button>
                  </div>
            </form>
      );
};

export default function EditTasksPage() {
      const [tasks, setTasks] = useState({});
      const [userDept, setUserDept] = useState(null);
      const [loading, setLoading] = useState(true);
      const [editingTask, setEditingTask] = useState(null);

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

      const handleEdit = (taskId) => {
            setEditingTask({ id: taskId, ...tasks[taskId] });
      };

      const handleSave = async (editedTask) => {
            const taskRef = ref(database, `tasks/${userDept}/${editedTask.id}`);
            const updates = {
                  number: Number(editedTask.number),
                  deadline: editedTask.deadline,
                  'update-time': new Date().toISOString()
            };
            await update(taskRef, updates);
            setEditingTask(null);
      };

      const handleCancel = () => {
            setEditingTask(null);
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

      if (!userDept) {
            return <div className="container mx-auto px-4 py-8">請登入帳號以修改教材需求表</div>;
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
                                                {editingTask && editingTask.id === taskId ? (
                                                      <TaskEditForm task={editingTask} onSave={handleSave} onCancel={handleCancel} />
                                                ) : (
                                                      <>
                                                            <h3 className="font-medium text-lg mb-3 text-black">{task.category}</h3>
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
                                                            <button
                                                                  onClick={() => handleEdit(taskId)}
                                                                  className="px-4 py-2 bg-blue-500 text-white rounded"
                                                            >
                                                                  編輯
                                                            </button>
                                                      </>
                                                )}
                                          </li>
                                    ))}
                              </ul>
                        )}
                  </div>
            </div>
      );
}