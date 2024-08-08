'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { database } from '@/config/firebaseConfig';

const taskProperties = [
  { key: 'quest-time', label: '提出時間', type: 'text' },
  { key: 'category', label: '分類', type: 'text' },
  { key: 'main', label: '教材名', type: 'text' },
  { key: 'tag', label: '版本', type: 'text' },
  { key: 'form', label: '教用/學用', type: 'text' },
  { key: 'number', label: '數量', type: 'number' },
  { key: 'deadline', label: 'Deadline', type: 'date' },
  { key: 'additional', label: '備註', type: 'textarea' },
  { key: 'state', label: '目前狀態', type: 'text' },
  { key: 'update-time', label: '最後更新', type: 'text' }
];

const TaskEditForm = ({ task, onSave, onCancel }) => {
  const [editedTask, setEditedTask] = useState(task);

  const handleChange = (key, value) => {
    setEditedTask(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedTask);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-black">
      {taskProperties.map(prop => (
        <div key={prop.key} className="flex flex-col">
          <label className="font-semibold">{prop.label}</label>
          {prop.type === 'textarea' ? (
            <textarea
              value={editedTask[prop.key]}
              onChange={(e) => handleChange(prop.key, e.target.value)}
              className="border p-2 rounded"
            />
          ) : (
            <input
              type={prop.type}
              value={editedTask[prop.key]}
              onChange={(e) => handleChange(prop.key, e.target.value)}
              className="border p-2 rounded"
            />
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
    await update(taskRef, editedTask);
    setEditingTask(null);
  };

  const handleCancel = () => {
    setEditingTask(null);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!userDept) {
    return <div className="container mx-auto px-4 py-8">Please log in to edit tasks.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Tasks for {userDept}</h1>
      {Object.keys(tasks).length === 0 ? (
        <p>No tasks found for your department.</p>
      ) : (
        <ul className="space-y-6">
          {Object.entries(tasks).map(([taskId, task]) => (
            <li key={taskId} className="bg-gray-50 p-4 rounded-lg">
              {editingTask && editingTask.id === taskId ? (
                <TaskEditForm task={editingTask} onSave={handleSave} onCancel={handleCancel} />
              ) : (
                <>
                  <h3 className="font-medium text-lg mb-3 text-black">{task.main}</h3>
                  <table className="w-full text-sm mb-4 text-black">
                    <tbody>
                      {taskProperties.map((prop, index) => (
                        <tr key={prop.key} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
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
  );
}