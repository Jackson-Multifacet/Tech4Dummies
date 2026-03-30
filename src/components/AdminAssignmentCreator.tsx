import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';

export default function AdminAssignmentCreator() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const id = crypto.randomUUID();
    const path = 'assignments/' + id;
    try {
      await setDoc(doc(db, 'assignments', id), {
        id,
        title,
        description,
        dueDate: new Date(dueDate).getTime(),
        createdAt: Date.now()
      });
      alert('Assignment created!');
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
      <h2 className="text-2xl font-bold text-white">Create Assignment</h2>
      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 rounded bg-zinc-800 text-white" required />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full p-2 rounded bg-zinc-800 text-white" required />
      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 rounded bg-zinc-800 text-white" required />
      <button type="submit" disabled={saving} className="bg-blue-600 text-white p-2 rounded">{saving ? 'Saving...' : 'Create'}</button>
    </form>
  );
}
