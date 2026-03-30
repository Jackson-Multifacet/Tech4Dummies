import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  getDocs,
  setDoc,
  limit
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { Search, Send, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: number;
  otherUserName?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: number;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export default function DirectMessages() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
      setRooms(roomData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'chatRooms'));

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeRoom) return;

    const q = query(
      collection(db, `chatRooms/${activeRoom.id}/messages`),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `chatRooms/${activeRoom.id}/messages`));

    return unsubscribe;
  }, [activeRoom]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Search the 'users_public' collection for other users
      const q = query(
        collection(db, 'users_public'),
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
        .filter(u => u.uid !== auth.currentUser?.uid);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const startChat = async (otherUser: UserProfile) => {
    if (!auth.currentUser) return;

    // Check if room already exists
    const existingRoom = rooms.find(r => r.participants.includes(otherUser.uid));
    if (existingRoom) {
      setActiveRoom(existingRoom);
      setSearchResults([]);
      setSearchQuery('');
      return;
    }

    // Create new room
    const roomId = [auth.currentUser.uid, otherUser.uid].sort().join('_');
    const roomRef = doc(db, 'chatRooms', roomId);
    
    try {
      await setDoc(roomRef, {
        id: roomId,
        participants: [auth.currentUser.uid, otherUser.uid],
        lastMessageAt: Date.now(),
        otherUserName: otherUser.displayName // Simplified for demo
      });
      setActiveRoom({ id: roomId, participants: [auth.currentUser.uid, otherUser.uid], otherUserName: otherUser.displayName });
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'chatRooms');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || !auth.currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const roomRef = doc(db, 'chatRooms', activeRoom.id);
      await addDoc(collection(db, `chatRooms/${activeRoom.id}/messages`), {
        senderId: auth.currentUser.uid,
        content: messageContent,
        createdAt: Date.now()
      });

      await updateDoc(roomRef, {
        lastMessage: messageContent,
        lastMessageAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chatRooms/${activeRoom.id}/messages`);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] max-w-6xl mx-auto bg-zinc-950/40 border border-zinc-800 rounded-2xl overflow-hidden m-4">
      {/* Sidebar: Conversations */}
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search users..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              {searchResults.map(user => (
                <button 
                  key={user.uid}
                  onClick={() => startChat(user)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-zinc-800 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <UserIcon size={16} />
                  </div>
                  <span className="text-sm text-white font-medium">{user.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {rooms.map(room => (
            <button 
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={cn(
                "w-full p-4 flex items-center gap-3 hover:bg-zinc-900/40 transition-colors text-left border-b border-zinc-900",
                activeRoom?.id === room.id && "bg-emerald-500/5 border-l-2 border-l-emerald-500"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <UserIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white truncate">
                    {room.otherUserName || 'Chat'}
                  </span>
                  {room.lastMessageAt && (
                    <span className="text-[10px] text-zinc-600">
                      {new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {room.lastMessage || 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main: Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-900/20">
        {activeRoom ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950/20">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <UserIcon size={16} />
              </div>
              <span className="font-bold text-white">{activeRoom.otherUserName || 'Chat'}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === auth.currentUser?.uid;
                return (
                  <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] p-3 rounded-2xl text-sm",
                      isMe 
                        ? "bg-emerald-500 text-black font-medium rounded-tr-none" 
                        : "bg-zinc-800 text-zinc-200 rounded-tl-none"
                    )}>
                      {msg.content}
                      <div className={cn(
                        "text-[10px] mt-1 opacity-50",
                        isMe ? "text-black" : "text-zinc-500"
                      )}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950/20">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black p-2 rounded-xl transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <Send size={32} />
            </div>
            <h3 className="text-lg font-bold text-zinc-400">Your Messages</h3>
            <p className="max-w-xs mt-2">Select a conversation or search for a user to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
