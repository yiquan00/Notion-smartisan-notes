'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 

interface Note {
  id: string;
  properties: {
    Name: {
      title: { text: { content: string } }[];
    };
    'Last edited time': {
      last_edited_time: string;
    };
  };
}

const debounce = (fn: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const Home = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const router = useRouter();
  const slideStartX = useRef<number | null>(null);
  const currentlySlidingRef = useRef<string | null>(null);
  const currentlyActiveRef = useRef<string | null>(null);

  useEffect(() => {
    fetchNotes(true); // 第一次加载时获取所有笔记
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const handleDocumentClick = () => {
    if (currentlyActiveRef.current) {
      const currentElement = document.getElementById(currentlyActiveRef.current);
      if (currentElement) {
        currentElement.classList.remove('sliding-right');
      }
      currentlyActiveRef.current = null;
    }
  };

  const fetchNotes = async (isFirstLoad = false) => {
    if (loading) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/notes?startCursor=${isFirstLoad ? '' : cursor}&pageSize=10`);
      const data = await response.json();

      console.log(data.results);

      if (response.ok) {
        if (isFirstLoad) {
          setNotes(data.results);
        } else {
          setNotes((prevNotes) => [...prevNotes, ...data.results]);
        }
        setCursor(data.next_cursor || null);
        setHasMore(data.has_more);
      } else {
        setErrorMessage('Failed to fetch notes.');
      }
    } catch (error) {
      setErrorMessage(error.toString());
    }
    setLoading(false);
  };

  const searchNotes = async (query: string) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/notes/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchQuery: query }),
      });
      const data = await response.json();

      console.log('Search Response:', data);

      if (response.ok) {
        setNotes(data);
      } else {
        setErrorMessage(`Failed to search notes. Error: ${data.error}`);
      }
    } catch (error) {
      setErrorMessage(error.toString());
    }

    setLoading(false);
  };

  const handleSearch = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query) {
      searchNotes(query);
    } else {
      fetchNotes(true);
    }
  }, 300);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchNotes(false);
    }
  };
  
const resetAllSlidingItems = () => {
  if (currentlySlidingRef.current) {
    const element = document.getElementById(currentlySlidingRef.current);
    if (element) {
      element.classList.remove('sliding-right');
    }
    currentlySlidingRef.current = null;
  }
};
  const handleTouchStart = (e: React.TouchEvent, noteId: string) => {
    resetAllSlidingItems(); // 重置所有其他已滑动的项
    slideStartX.current = e.touches[0].clientX;
    currentlySlidingRef.current = noteId;
  };
 const handleTouchMove = (e: React.TouchEvent, noteId: string) => {
   if (slideStartX.current === null || noteId !== currentlySlidingRef.current) return;
 
   const diffX = e.touches[0].clientX - slideStartX.current;
   if (diffX > 50) { 
     const element = document.getElementById(noteId);
     if (element) {
       element.classList.add('sliding-right');
       element.classList.remove('sliding-left');
     }
     currentlySlidingRef.current = noteId;
   } else if (diffX < -50) { 
     const element = document.getElementById(noteId);
     if (element) {
       element.classList.remove('sliding-right');
       element.classList.add('sliding-left');
     }
     currentlySlidingRef.current = null;
   }
 };

  const handleTouchEnd = () => {
    slideStartX.current = null;
    currentlySlidingRef.current = null;
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      setErrorMessage(error.toString());
    }
  };

  const handleNoteClick = (noteId: string) => {
    if (currentlySlidingRef.current === noteId) {
      // 如果当前点击的项是滑动状态的项，恢复原位
      const element = document.getElementById(currentlySlidingRef.current);
      if (element) {
        element.classList.remove('sliding-right');
      }
      currentlySlidingRef.current = null;
    } else {
      router.push(`/notes/${noteId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  return (
    <div className="flex flex-col h-screen bg-cover bg-center" style={{ backgroundImage: 'url("/background.jpg")' }}>
      <header className="flex items-center justify-between p-4 bg-white bg-opacity-80 shadow-md">
        <button className="text-lg font-semibold">☰</button>
		<h1 className="absolute left-1/2 transform -translate-x-1/2 text-white font-semibold text-lg">全部便签</h1>
        <button className="ml-2 px-4 py-2 text-white bg-transparent rounded-sm add-new w-6 h-6" onClick={() => router.push('/notes/new')}>
          
        </button>
      </header>

      {errorMessage && <div className="text-red-500 text-center">{errorMessage}</div>}

      <div className="flex items-center justify-center mt-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
              setSearchQuery(e.target.value); // 直接更新 searchQuery state
              handleSearch(e); // 调用 debounce 处理搜索
            }}
          placeholder="  搜索笔记内容..."
          className="flex-grow mx-4  border rounded-lg"
        />
      </div>

      <main className="flex-grow overflow-y-auto p-4" onClick={handleDocumentClick}>
        <ul>
          {notes.map((note) => (
            <li 
              key={note.id} 
              id={note.id}
              className="note-item flex justify-between items-center p-4 mb-2 bg-white bg-opacity-80 rounded-sm shadow-md "
              onClick={() => handleNoteClick(note.id)}
              onTouchStart={(e) => handleTouchStart(e, note.id)}
              onTouchMove={(e) => handleTouchMove(e, note.id)}
              onTouchEnd={handleTouchEnd}
            >
              <div className='truncate'>
                <div className="date text-xs mb-1">
                  {note.properties?.['Last edited time']?.last_edited_time ? formatDate(note.properties['Last edited time'].last_edited_time) : 'No date'}
                </div>
                <div className="content mt-1 text-black truncate ">
                  {note.properties?.Name?.title?.[0]?.text?.content || 'No title'}
                </div>
              </div>
              <button 
                className="delete-button ml-4 px-2 py-1 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
              >
                删除
              </button>
            </li>
          ))}
        </ul>
        {loading && <div className="text-center mt-4">加载中...</div>}
        {!loading && hasMore && (
          <div className="text-center mt-4">
            <button className="px-4 py-2 text-white bg-blue-500 rounded-lg" onClick={handleLoadMore}>
              点击加载更多
            </button>
          </div>
        )}
        {!hasMore && <div className="text-center mt-4">没有更多内容了</div>}
      </main>
    </div>
  );
};

export default Home;