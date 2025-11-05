import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User, ChatThread, ChatMessage } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon, PaperAirplaneIcon } from './icons';

interface ChatProps {
    currentUser: User;
    users: User[];
    threads: ChatThread[];
    messages: ChatMessage[];
    // Fix: Update prop type to expect a Promise
    onCreateThread: (threadData: Omit<ChatThread, 'id'>) => Promise<string>;
    onSendMessage: (chatId: string, text: string) => void;
    onEditMessage: (messageId: string, newText: string) => void;
    onDeleteMessage: (messageId: string) => void;
    onEditThread: (threadId: string, newName: string) => void;
    onDeleteThread: (threadId: string) => void;
    selectedThreadId: string | null;
    setSelectedThreadId: (id: string | null) => void;
    unreadThreads: Set<string>;
    onMarkAsRead: (threadId: string) => void;
}

const NewConversationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    existingThreads: ChatThread[];
    // Fix: Update prop type to expect a Promise
    onCreate: (threadData: Omit<ChatThread, 'id'>) => Promise<string>;
    onActivateThread: (threadId: string) => void;
}> = ({ isOpen, onClose, users, currentUser, existingThreads, onCreate, onActivateThread }) => {
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [groupName, setGroupName] = useState('');
    const isGroup = selectedUserIds.size > 1;

    if (!isOpen) return null;

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    // Fix: Make function async to handle promise from onCreate
    const handleCreate = async () => {
        const participantIds = [currentUser.id, ...Array.from(selectedUserIds)];
        
        if (!isGroup && selectedUserIds.size === 1) {
            const otherUserId = Array.from(selectedUserIds)[0];
            const existing = existingThreads.find(t => 
                !t.isGroup &&
                t.participantIds.length === 2 &&
                t.participantIds.includes(currentUser.id) &&
                t.participantIds.includes(otherUserId)
            );
            if (existing) {
                onActivateThread(existing.id);
                onClose();
                return;
            }
        }
        
        const newThreadId = await onCreate({
            participantIds,
            isGroup,
            name: isGroup ? groupName : undefined,
            organizationId: currentUser.organizationId
        });
        onActivateThread(newThreadId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md m-4">
                <h3 className="text-xl font-bold mb-4">Nueva Conversación</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {users.filter(u => u.id !== currentUser.id).map(user => (
                        <div key={user.id} className="flex items-center p-2 rounded-lg hover:bg-brand-bg/50">
                            <input
                                type="checkbox"
                                id={`user-${user.id}`}
                                checked={selectedUserIds.has(user.id)}
                                onChange={() => handleUserToggle(user.id)}
                                className="h-4 w-4 rounded bg-brand-bg border-brand-border text-brand-accent-cyan focus:ring-brand-accent-cyan"
                            />
                            <label htmlFor={`user-${user.id}`} className="ml-3 text-brand-text-primary">{user.name}</label>
                        </div>
                    ))}
                </div>
                {isGroup && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Nombre del Grupo</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full p-2 border border-brand-border bg-brand-bg rounded-md"
                            placeholder="Ej: Equipo de Diseño"
                            required
                        />
                    </div>
                )}
                <div className="flex justify-end gap-4 pt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                    <button onClick={handleCreate} disabled={selectedUserIds.size === 0 || (isGroup && !groupName.trim())} className="px-4 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg disabled:opacity-50">
                        Crear Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

const Chat: React.FC<ChatProps> = (props) => {
    const { currentUser, users, threads, messages, onCreateThread, onSendMessage, onEditMessage, onDeleteMessage, onEditThread, onDeleteThread, selectedThreadId, setSelectedThreadId, unreadThreads, onMarkAsRead } = props;

    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
    const [editedText, setEditedText] = useState('');
    const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
    const [threadToDelete, setThreadToDelete] = useState<ChatThread | null>(null);
    const [threadToEdit, setThreadToEdit] = useState<ChatThread | null>(null);
    const [editedGroupName, setEditedGroupName] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, selectedThreadId]);
    
    const activeThread = threads.find(t => t.id === selectedThreadId);
    const activeMessages = messages
        .filter(m => m.chatId === selectedThreadId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const getThreadDisplayName = (thread: ChatThread) => {
        if (thread.isGroup) return thread.name || 'Grupo sin nombre';
        const otherId = thread.participantIds.find(id => id !== currentUser.id);
        return users.find(u => u.id === otherId)?.name || 'Usuario Desconocido';
    };

    const threadsWithLastMessage = useMemo(() => {
        return threads
            .map(thread => {
                const threadMessages = messages.filter(m => m.chatId === thread.id);
                const lastMessage = threadMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                return { ...thread, lastMessage };
            })
            .sort((a, b) => {
                if (!a.lastMessage) return 1;
                if (!b.lastMessage) return -1;
                return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
            });
    }, [threads, messages]);

    const handleSendMessageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && selectedThreadId) {
            onSendMessage(selectedThreadId, newMessage.trim());
            setNewMessage('');
        }
    };

    const handleStartEdit = (message: ChatMessage) => {
        setEditingMessage(message);
        setEditedText(message.text);
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditedText('');
    };

    const handleSaveEdit = () => {
        if (editingMessage && editedText.trim()) {
            onEditMessage(editingMessage.id, editedText.trim());
        }
        handleCancelEdit();
    };

    const confirmDeleteMessage = () => {
        if (messageToDelete) {
            onDeleteMessage(messageToDelete.id);
        }
        setMessageToDelete(null);
    };

    const confirmDeleteThread = () => {
        if (threadToDelete) {
            onDeleteThread(threadToDelete.id);
        }
        setThreadToDelete(null);
    };
    
    const handleStartEditThread = (thread: ChatThread) => {
        setThreadToEdit(thread);
        setEditedGroupName(thread.name || '');
    };
    
    const handleSaveThreadName = () => {
        if (threadToEdit && editedGroupName.trim()) {
            onEditThread(threadToEdit.id, editedGroupName.trim());
        }
        setThreadToEdit(null);
    };

    const getAvatarInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);

    return (
        <div className="flex h-full">
            <NewConversationModal isOpen={isNewConvoModalOpen} onClose={() => setIsNewConvoModalOpen(false)} users={users} currentUser={currentUser} existingThreads={threads} onCreate={onCreateThread} onActivateThread={setSelectedThreadId} />

            {/* Modals for actions */}
            {messageToDelete && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-sm m-4">
                        <h3 className="text-lg font-bold">Eliminar Mensaje</h3>
                        <p className="text-brand-text-secondary my-2">¿Estás seguro? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setMessageToDelete(null)} className="px-4 py-2 bg-slate-700 rounded-lg">Cancelar</button>
                            <button onClick={confirmDeleteMessage} className="px-4 py-2 bg-red-600 text-white rounded-lg">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
             {threadToDelete && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-sm m-4">
                        <h3 className="text-lg font-bold">Eliminar Conversación</h3>
                        <p className="text-brand-text-secondary my-2">Todos los mensajes en esta conversación se eliminarán para todos. ¿Estás seguro?</p>
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setThreadToDelete(null)} className="px-4 py-2 bg-slate-700 rounded-lg">Cancelar</button>
                            <button onClick={confirmDeleteThread} className="px-4 py-2 bg-red-600 text-white rounded-lg">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            {threadToEdit && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-sm m-4">
                        <h3 className="text-lg font-bold mb-4">Editar Nombre del Grupo</h3>
                        <input type="text" value={editedGroupName} onChange={e => setEditedGroupName(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" />
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setThreadToEdit(null)} className="px-4 py-2 bg-slate-700 rounded-lg">Cancelar</button>
                            <button onClick={handleSaveThreadName} className="px-4 py-2 bg-brand-accent-blue text-white rounded-lg">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            <aside className="w-1/3 bg-brand-card border-r border-brand-border flex flex-col">
                <div className="p-4 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-xl font-bold">Conversaciones</h2>
                    <button onClick={() => setIsNewConvoModalOpen(true)} className="p-2 rounded-full hover:bg-slate-700">
                        <PlusIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {threadsWithLastMessage.map(thread => {
                        const isUnread = unreadThreads.has(thread.id);
                        return (
                        <div key={thread.id} className="group relative">
                            <div 
                                onClick={() => {
                                    setSelectedThreadId(thread.id);
                                    onMarkAsRead(thread.id);
                                }}
                                className={`p-4 cursor-pointer border-l-4 flex items-center gap-3 ${selectedThreadId === thread.id ? 'bg-brand-accent-blue/20 border-brand-accent-cyan' : 'border-transparent hover:bg-slate-800'}`}
                            >
                                <div className="w-2.5 flex-shrink-0">
                                    {isUnread && <div className="h-2.5 w-2.5 bg-brand-accent-cyan rounded-full" title="Mensajes no leídos"></div>}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <p className={`font-semibold truncate ${isUnread ? 'text-brand-text-primary' : ''}`}>{getThreadDisplayName(thread)}</p>
                                    {thread.lastMessage && (
                                        <p className={`text-sm truncate mt-1 ${isUnread ? 'text-brand-text-primary' : 'text-brand-text-secondary'}`}>
                                            {thread.lastMessage.text} · {new Date(thread.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            </div>
                             <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="relative">
                                    <button className="p-1 rounded-full hover:bg-slate-700 peer">
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-slate-900 border border-brand-border rounded-lg shadow-lg hidden peer-focus:block hover:block focus:block z-10">
                                        {thread.isGroup && <button onClick={() => handleStartEditThread(thread)} className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-800">Editar Grupo</button>}
                                        <button onClick={() => setThreadToDelete(thread)} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800">Eliminar Conversación</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </aside>

            <main className="w-2/3 flex flex-col bg-brand-bg">
                {activeThread ? (
                    <>
                        <header className="p-4 border-b border-brand-border bg-brand-card">
                            <h3 className="text-lg font-bold">{getThreadDisplayName(activeThread)}</h3>
                        </header>
                        <div className="flex-1 p-6 overflow-y-auto space-y-1">
                            {activeMessages.map((msg, index, array) => {
                                const sender = users.find(u => u.id === msg.senderId);
                                const isCurrentUser = msg.senderId === currentUser.id;
                                const isFirstInGroup = index === 0 || array[index - 1].senderId !== msg.senderId;
                                
                                if (editingMessage?.id === msg.id) {
                                    return (
                                        <div key="edit-form" className="flex items-end gap-3 justify-end py-2">
                                            <div className="w-full">
                                                <textarea value={editedText} onChange={e => setEditedText(e.target.value)} className="w-full p-2 bg-brand-card border border-brand-border rounded-lg" rows={2}></textarea>
                                                <div className="flex gap-2 justify-end mt-1">
                                                    <button onClick={handleCancelEdit} className="text-xs px-2 py-1 bg-slate-600 rounded">Cancelar</button>
                                                    <button onClick={handleSaveEdit} className="text-xs px-2 py-1 bg-brand-accent-blue rounded">Guardar</button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return (
                                    <div key={msg.id} className={`flex items-end gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}>
                                        <div className="group flex items-center gap-2 max-w-lg" dir={isCurrentUser ? 'rtl' : 'ltr'}>
                                            <div className="flex-shrink-0">
                                                {!isCurrentUser && isFirstInGroup && (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">{sender ? getAvatarInitials(sender.name) : 'U'}</div>
                                                )}
                                            </div>
                                            <div>
                                                {!isCurrentUser && isFirstInGroup && <p className="text-xs text-brand-text-secondary mb-1 ml-2">{sender?.name}</p>}
                                                <div className={`relative px-4 py-2 rounded-2xl ${isCurrentUser ? 'bg-brand-accent-blue text-white rounded-br-none' : 'bg-brand-card text-brand-text-primary rounded-bl-none'}`}>
                                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                                    <div className={`absolute bottom-1 text-xs opacity-0 group-hover:opacity-60 transition-opacity ${isCurrentUser ? 'left-2' : 'right-2'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            {isCurrentUser && (
                                                <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleStartEdit(msg)} className="p-1 rounded-full hover:bg-black/20"><PencilIcon className="w-3 h-3 text-white" /></button>
                                                    <button onClick={() => setMessageToDelete(msg)} className="p-1 rounded-full hover:bg-black/20"><TrashIcon className="w-3 h-3 text-white" /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-brand-bg border-t border-brand-border">
                            <form onSubmit={handleSendMessageSubmit} className="flex gap-4">
                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 p-3 border border-brand-border bg-brand-card rounded-lg" />
                                <button type="submit" aria-label="Enviar mensaje" className="p-3 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg">
                                    <PaperAirplaneIcon className="w-6 h-6"/>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <h2 className="text-xl font-bold">Bienvenido al Chat</h2>
                            <p className="text-brand-text-secondary">Selecciona una conversación o crea una nueva para empezar.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Chat;
