'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CreateNote = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateNote = async () => {
    if (!title || !content) {
      setErrorMessage('Title and content are required');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      if (response.ok) {
        const note = await response.json();
        router.push(`/notes/${note.id}`);
      } else {
        const errorData = await response.json();
        setErrorMessage(`Failed to create note: ${errorData.error}`);
      }
    } catch (error) {
      setErrorMessage(error.toString());
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-lg font-semibold">← 返回</button>
      <h1 className="text-2xl font-bold mt-4">新建笔记</h1>
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <div className="mt-4">
        <input
          type="text"
          placeholder="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 mb-4 border rounded-md"
        />
        <textarea
          placeholder="内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 mb-4 border rounded-md"
          rows={10}
        ></textarea>
        <button
          onClick={handleCreateNote}
          className="px-4 py-2 text-white bg-blue-500 rounded-md"
          disabled={loading}
        >
          {loading ? '创建中...' : '创建'}
        </button>
      </div>
    </div>
  );
};

export default CreateNote;