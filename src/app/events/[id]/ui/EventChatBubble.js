'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    IconChatBubble,
    IconSend,
    IconClose,
    IconPin,
    IconReply,
    IconUsers,
    IconChevronLeft,
    IconTree,
} from '@/app/events/ui/icons';
import { playChatChime, useAnimatedCount } from './chat/chatUtils';
import ChatMessageItem from './chat/ChatMessageItem';
import ChatIdentityModal from './chat/ChatIdentityModal';
import ChatImageLightbox from './chat/ChatImageLightbox';
import ScrollToBottomButton from './chat/ScrollToBottomButton';
import ChatChannelListView from './chat/ChatChannelListView';
import TaskMentionPickerModal from './chat/TaskMentionPickerModal';
import { useEventDialog } from '@/app/events/ui/common';

export default function EventChatBubble({
    eventId,
    event = {},
    currentUser = null,
    isPublic = false,
    shareToken = '',
    members = [],
    allEvents = [],
}) {
    const dialog = useEventDialog();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const initialPreview = event?.lastChatMessage || (Array.isArray(event?.chatMessages) && event.chatMessages.length > 0 ? event.chatMessages[event.chatMessages.length - 1] : null);
        return initialPreview ? [initialPreview] : [];
    });
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [pinnedMessage, setPinnedMessage] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasUrgentUnread, setHasUrgentUnread] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [taggedTask, setTaggedTask] = useState(null);
    const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [activeLightboxImg, setActiveLightboxImg] = useState(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const highlightTimerRef = useRef(null);

    const [authedUser, setAuthedUser] = useState(currentUser);
    const activeCurrentUser = currentUser || authedUser;

    // View mode: 'list' (Inbox / List of events) or 'chat' (Specific event chat room)
    const [viewMode, setViewMode] = useState(isPublic ? 'chat' : 'list');

    // Multi-event channel switcher state
    const initialEventId = useMemo(() => {
        if (eventId && eventId !== 'undefined' && eventId !== 'null') return String(eventId);
        if (event?._id && event._id !== 'undefined' && event._id !== 'null') return String(event._id);
        if (event?.id && event.id !== 'undefined' && event.id !== 'null') return String(event.id);
        if (shareToken && shareToken !== 'undefined' && shareToken !== 'null') return String(shareToken);
        return '';
    }, [eventId, event?._id, event?.id, shareToken]);

    // Identity for public / CTV users
    const [identity, setIdentity] = useState({
        name: '',
        role: 'CTV Sự kiện',
        id: '',
    });
    const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
    const [tempIdentityName, setTempIdentityName] = useState('');
    const [tempIdentityRole, setTempIdentityRole] = useState('CTV Sự kiện');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

    // Determine current user display info
    const myId = useMemo(() => {
        if (activeCurrentUser) return String(activeCurrentUser._id || activeCurrentUser.id || '');
        return identity.id || '';
    }, [activeCurrentUser, identity]);

    const myName = useMemo(() => {
        if (activeCurrentUser) return activeCurrentUser.name || 'Ban Tổ Chức';
        return identity.name || 'Cộng tác viên';
    }, [activeCurrentUser, identity]);

    const isBtcUser = useMemo(() => {
        if (activeCurrentUser) return true;
        return false;
    }, [activeCurrentUser]);

    const [selectedEventId, setSelectedEventId] = useState(initialEventId);
    const [availableEvents, setAvailableEvents] = useState(Array.isArray(allEvents) && allEvents.length > 0 ? allEvents : []);
    const [channelSearchQuery, setChannelSearchQuery] = useState('');
    const [channelFilterTab, setChannelFilterTab] = useState('all'); // 'all' | 'unread' | 'completed'
    const [readTimestamps, setReadTimestamps] = useState({});
    const [liveEventUpdates, setLiveEventUpdates] = useState({});

    // Pagination & load-more states
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const messageContainerRef = useRef(null);
    const isLoadingMoreRef = useRef(false);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const lastMessageIdRef = useRef(event?.lastChatMessage?.id || event?.lastChatMessage?._id || null);
    const isFirstFetchRef = useRef(true);

    // Load read timestamps from localStorage on mount
    useEffect(() => {
        try {
            const storedRead = localStorage.getItem('air_chat_read_map');
            if (storedRead) {
                setReadTimestamps(JSON.parse(storedRead));
            }
        } catch (e) {}
    }, []);

    // Try auto-resolving logged-in user if not passed from server props
    useEffect(() => {
        if (!currentUser && !isPublic) {
            let isMounted = true;
            fetch('/api/auth/me')
                .then(res => res.json())
                .then(data => {
                    if (isMounted && data.user) {
                        setAuthedUser(data.user);
                    }
                })
                .catch(() => {});
            return () => { isMounted = false; };
        }
    }, [currentUser, isPublic]);

    // Fetch all events for the list view if internal user
    useEffect(() => {
        if (activeCurrentUser && !isPublic && (!availableEvents || availableEvents.length === 0)) {
            let isMounted = true;
            fetch('/api/events', { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    if (isMounted && data.success && Array.isArray(data.events)) {
                        setAvailableEvents(data.events);
                    }
                })
                .catch(err => {
                    console.error('Error fetching available events for chat:', err);
                });
            return () => { isMounted = false; };
        }
    }, [activeCurrentUser, isPublic, availableEvents]);

    // Periodically refresh events list while on list view to keep latest messages up to date
    useEffect(() => {
        if (isOpen && viewMode === 'list' && activeCurrentUser && !isPublic) {
            const timer = setInterval(() => {
                fetch('/api/events', { cache: 'no-store' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && Array.isArray(data.events)) {
                            setAvailableEvents(data.events);
                        }
                    })
                    .catch(() => {});
            }, 12000);
            return () => clearInterval(timer);
        }
    }, [isOpen, viewMode, activeCurrentUser, isPublic]);

    // Active event object
    const currentActiveEvent = useMemo(() => {
        if (availableEvents && availableEvents.length > 0 && selectedEventId) {
            const found = availableEvents.find(e => String(e._id || e.id || e.code) === String(selectedEventId));
            if (found) return found;
        }
        return event || {};
    }, [availableEvents, selectedEventId, event]);

    // Resolve effective event identifier (ObjectId, sanitized id, code, or share token)
    const effectiveEventId = useMemo(() => {
        if (selectedEventId) return String(selectedEventId);
        return initialEventId;
    }, [selectedEventId, initialEventId]);

    // Effective members list for current active event
    const effectiveMembers = useMemo(() => {
        if (currentActiveEvent?.members && Array.isArray(currentActiveEvent.members) && currentActiveEvent.members.length > 0) {
            return currentActiveEvent.members;
        }
        return members || [];
    }, [currentActiveEvent, members]);

    // Effective roadmap tasks for current active event
    const effectiveRoadmap = useMemo(() => {
        if (currentActiveEvent?.roadmap && Array.isArray(currentActiveEvent.roadmap) && currentActiveEvent.roadmap.length > 0) {
            return currentActiveEvent.roadmap;
        }
        return event?.roadmap || [];
    }, [currentActiveEvent, event]);

    // Helper to check if an event has unread messages
    const isEventUnread = useCallback((evt) => {
        const evtId = String(evt._id || evt.id || evt.code);
        const lastMsg = evt.lastChatMessage;
        if (!lastMsg) return false;
        const isFromMe = (lastMsg.senderId && lastMsg.senderId === myId) || (lastMsg.senderName === myName && myName !== '');
        if (isFromMe) return false;
        
        const lastRead = readTimestamps[evtId] || readTimestamps[String(evt._id)] || readTimestamps[String(evt.id)] || readTimestamps[String(evt.code)];
        if (!lastRead) return true;
        const msgTime = new Date(lastMsg.createdAt || evt.latestMessageTime).getTime();
        const readTime = new Date(lastRead).getTime();
        return msgTime > readTime;
    }, [myId, myName, readTimestamps]);

    // Unread channels counter for badge
    const unreadChannelsCount = useMemo(() => {
        if (!availableEvents || !Array.isArray(availableEvents)) return 0;
        return availableEvents.filter(e => {
            const evtId = String(e._id || e.id || e.code);
            const live = liveEventUpdates[evtId];
            const lastMsg = live?.lastChatMessage || e.lastChatMessage || (e.chatMessages?.length > 0 ? e.chatMessages[e.chatMessages.length - 1] : null);
            return isEventUnread({ ...e, lastChatMessage: lastMsg });
        }).length;
    }, [availableEvents, liveEventUpdates, isEventUnread]);

    // Unread count animation states
    const rawBadgeCount = unreadCount > 0 ? unreadCount : unreadChannelsCount;
    const animatedBadgeCount = useAnimatedCount(rawBadgeCount, 80);
    const animatedChannelsCount = useAnimatedCount(unreadChannelsCount, 80);

    // Sorted and Filtered events list with newest messages on top
    const sortedEvents = useMemo(() => {
        if (!availableEvents || !Array.isArray(availableEvents)) return [];
        
        let list = availableEvents.map(evt => {
            const evtId = String(evt._id || evt.id || evt.code);
            const live = liveEventUpdates[evtId];
            const lastMsg = live?.lastChatMessage || evt.lastChatMessage || (evt.chatMessages?.length > 0 ? evt.chatMessages[evt.chatMessages.length - 1] : null);
            const latestTime = live?.latestMessageTime || evt.latestMessageTime || lastMsg?.createdAt || evt.updatedAt || evt.createdAt || evt.startDate;
            const timestamp = latestTime ? new Date(latestTime).getTime() : 0;
            const unread = isEventUnread({ ...evt, lastChatMessage: lastMsg, latestMessageTime: latestTime });
            return {
                ...evt,
                lastChatMessage: lastMsg,
                latestTimeTimestamp: timestamp,
                latestMessageTime: latestTime,
                isUnread: unread,
            };
        });

        // Sắp xếp giảm dần theo thời gian tin nhắn mới nhất
        list.sort((a, b) => b.latestTimeTimestamp - a.latestTimeTimestamp);

        // Filter tab: Tất cả, Chưa đọc, Đã hoàn thành
        if (channelFilterTab === 'unread') {
            list = list.filter(e => e.isUnread);
        } else if (channelFilterTab === 'completed') {
            list = list.filter(e => e.status === 'completed');
        }

        if (!channelSearchQuery.trim()) return list;
        const q = channelSearchQuery.trim().toLowerCase();
        return list.filter(e => 
            (e.title && e.title.toLowerCase().includes(q)) ||
            (e.code && e.code.toLowerCase().includes(q)) ||
            (e.location && e.location.toLowerCase().includes(q))
        );
    }, [availableEvents, liveEventUpdates, isEventUnread, channelFilterTab, channelSearchQuery]);

    const handleSelectEvent = (targetEvent) => {
        const targetId = String(targetEvent._id || targetEvent.id);
        const nowStr = new Date().toISOString();
        setReadTimestamps(prev => {
            const next = { ...prev, [targetId]: nowStr, [String(targetEvent.code)]: nowStr };
            try {
                localStorage.setItem('air_chat_read_map', JSON.stringify(next));
            } catch (e) {}
            return next;
        });
        setSelectedEventId(targetId);
        setViewMode('chat');
        
        // Instant visual feedback: load the preview/latest message immediately from state
        const live = liveEventUpdates[targetId] || liveEventUpdates[String(targetEvent.code)];
        const initialPreviewMsg = live?.lastChatMessage || targetEvent.lastChatMessage || (targetEvent.chatMessages?.length > 0 ? targetEvent.chatMessages[targetEvent.chatMessages.length - 1] : null);
        
        if (initialPreviewMsg) {
            setMessages([initialPreviewMsg]);
            lastMessageIdRef.current = initialPreviewMsg.id || initialPreviewMsg._id;
            setLoadingMessages(true);
        } else {
            setMessages([]);
            setLoadingMessages(true);
            lastMessageIdRef.current = null;
        }

        setHasMoreMessages(false);
        setLoadingMore(false);
        setPinnedMessage(null);
        setReplyingTo(null);
        setTaggedTask(null);
        setIsScrolledUp(false);
        isFirstFetchRef.current = true;
    };

    // Initialize Identity & Preferences
    useEffect(() => {
        // Close message action menu on outside click
        const handleGlobalClick = (e) => {
            if (!e.target.closest('.chat-msg-menu')) {
                setActiveMenuMessageId(null);
            }
        };
        if (activeMenuMessageId) {
            document.addEventListener('click', handleGlobalClick);
            return () => document.removeEventListener('click', handleGlobalClick);
        }
    }, [activeMenuMessageId]);

    // Auto-resize input textarea as user types longer message
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 34), 130)}px`;
        }
    }, [inputText]);

    useEffect(() => {
        // Load Identity for public users
        if (!activeCurrentUser && effectiveEventId) {
            try {
                const storedId = localStorage.getItem(`air_chat_id_${effectiveEventId}`);
                const storedName = localStorage.getItem(`air_chat_name_${effectiveEventId}`);
                const storedRole = localStorage.getItem(`air_chat_role_${effectiveEventId}`);
                if (storedName) {
                    setIdentity({
                        id: storedId || `ctv-${Date.now()}`,
                        name: storedName,
                        role: storedRole || 'CTV Sự kiện',
                    });
                    setTempIdentityName(storedName);
                    setTempIdentityRole(storedRole || 'CTV Sự kiện');
                } else {
                    const defaultId = `ctv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                    setIdentity(prev => ({ ...prev, id: defaultId }));
                }
            } catch (e) {}
        }
    }, [activeCurrentUser, effectiveEventId]);

    // Scroll to bottom helper
    const scrollToBottom = useCallback((smooth = true) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
            setIsScrolledUp(false);
        }
    }, []);

    // Scroll listener for message stream to show/hide "Jump to latest" button
    const handleScroll = useCallback(() => {
        const el = messageContainerRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setIsScrolledUp(distanceFromBottom > 100);
    }, []);

    // Fetch messages from API (initial/refresh fetch limit=30)
    const fetchMessages = useCallback(async (isPolling = false) => {
        if (!effectiveEventId) return;
        if (!isPolling && isFirstFetchRef.current) {
            setLoadingMessages(true);
        }
        try {
            const tokenParam = shareToken ? `&shareToken=${encodeURIComponent(shareToken)}` : '';
            const res = await fetch(`/api/events/${effectiveEventId}/chat?limit=30${tokenParam}`);
            const data = await res.json();
            if (res.ok && data.success) {
                const newMsgs = data.messages || [];
                setPinnedMessage(data.pinnedChatMessage || null);
                setHasMoreMessages(Boolean(data.hasMore));

                // Check for new messages during polling and count ALL incoming unread messages
                if (isPolling && !isFirstFetchRef.current && newMsgs.length > 0) {
                    const lastOldId = lastMessageIdRef.current;
                    let incomingNew = [];
                    if (lastOldId) {
                        const idx = newMsgs.findIndex(m => String(m.id || m._id) === String(lastOldId));
                        incomingNew = idx !== -1 ? newMsgs.slice(idx + 1) : newMsgs;
                    } else {
                        incomingNew = newMsgs;
                    }

                    const incomingNotFromMe = incomingNew.filter(m => {
                        const isFromMe = (m.senderId && m.senderId === myId) || (m.senderName === myName && myName !== '');
                        return !isFromMe;
                    });

                    if (incomingNotFromMe.length > 0) {
                        if (!isOpen) {
                            setUnreadCount(prev => prev + incomingNotFromMe.length);
                            if (incomingNotFromMe.some(m => m.isUrgent)) {
                                setHasUrgentUnread(true);
                            }
                        }
                        playChatChime(incomingNotFromMe.some(m => m.isUrgent));
                    }
                }

                if (newMsgs.length > 0) {
                    const newest = newMsgs[newMsgs.length - 1];
                    lastMessageIdRef.current = newest.id || newest._id;
                    setLiveEventUpdates(prev => ({
                        ...prev,
                        [effectiveEventId]: {
                            lastChatMessage: newest,
                            latestMessageTime: newest.createdAt,
                        }
                    }));
                }

                setMessages(prev => {
                    const optimisticMsgs = prev.filter(m => m.isOptimistic);
                    if (isFirstFetchRef.current || prev.length <= 1) {
                        if (optimisticMsgs.length === 0) {
                            return newMsgs;
                        }
                        const newMsgIdSet = new Set(newMsgs.map(m => String(m.id || m._id)));
                        const pendingOptimistic = optimisticMsgs.filter(m => !newMsgIdSet.has(String(m.id || m._id)));
                        return [...newMsgs, ...pendingOptimistic];
                    }
                    const existingIdSet = new Set(prev.map(m => String(m.id || m._id)));
                    const incomingNew = newMsgs.filter(m => !existingIdSet.has(String(m.id || m._id)));
                    if (incomingNew.length === 0) return prev;
                    return [...prev, ...incomingNew];
                });
                isFirstFetchRef.current = false;
            }
        } catch (err) {
            console.error('Error fetching chat messages:', err);
        } finally {
            if (!isPolling) {
                setLoadingMessages(false);
            }
        }
    }, [effectiveEventId, shareToken, myId, myName, isOpen]);

    // Load older messages (pagination)
    const handleLoadMoreMessages = useCallback(async () => {
        if (loadingMore || !hasMoreMessages || messages.length === 0 || !effectiveEventId) return;
        setLoadingMore(true);
        isLoadingMoreRef.current = true;
        const oldestMsg = messages[0];
        const oldestTime = oldestMsg?.createdAt;

        const scrollContainer = messageContainerRef.current;
        const prevScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;
        const prevScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

        try {
            const tokenParam = shareToken ? `&shareToken=${encodeURIComponent(shareToken)}` : '';
            const beforeParam = oldestTime ? `&before=${encodeURIComponent(oldestTime)}` : '';
            const res = await fetch(`/api/events/${effectiveEventId}/chat?limit=30${beforeParam}${tokenParam}`);
            const data = await res.json();
            if (res.ok && data.success) {
                const olderMsgs = data.messages || [];
                setHasMoreMessages(Boolean(data.hasMore));
                if (olderMsgs.length > 0) {
                    setMessages(prev => {
                        const existingIdSet = new Set(prev.map(m => String(m.id || m._id)));
                        const filteredOlder = olderMsgs.filter(m => !existingIdSet.has(String(m.id || m._id)));
                        return [...filteredOlder, ...prev];
                    });

                    requestAnimationFrame(() => {
                        if (scrollContainer) {
                            const newScrollHeight = scrollContainer.scrollHeight;
                            scrollContainer.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
                        }
                        setTimeout(() => {
                            isLoadingMoreRef.current = false;
                        }, 150);
                    });
                } else {
                    isLoadingMoreRef.current = false;
                }
            }
        } catch (err) {
            console.error('Error loading older messages:', err);
            isLoadingMoreRef.current = false;
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMoreMessages, messages, effectiveEventId, shareToken]);

    // Polling effect
    useEffect(() => {
        if (!effectiveEventId) return;
        fetchMessages(false);

        // Active interval: 3.5s when open, 12s when closed
        const intervalMs = isOpen ? 3500 : 12000;
        const timer = setInterval(() => {
            fetchMessages(true);
        }, intervalMs);

        return () => clearInterval(timer);
    }, [effectiveEventId, isOpen, fetchMessages]);

    // Auto-scroll when open and new messages arrive (only if user hasn't scrolled up)
    useEffect(() => {
        if (isOpen && !isLoadingMoreRef.current && !isScrolledUp) {
            scrollToBottom(false);
            setUnreadCount(0);
            setHasUrgentUnread(false);
        }
    }, [isOpen, messages.length, scrollToBottom, isScrolledUp]);

    const filteredMembers = useMemo(() => {
        if (!effectiveMembers || !Array.isArray(effectiveMembers)) return [];
        if (!memberSearchQuery.trim()) return effectiveMembers;
        const q = memberSearchQuery.toLowerCase().trim();
        return effectiveMembers.filter(m => 
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.role && m.role.toLowerCase().includes(q))
        );
    }, [effectiveMembers, memberSearchQuery]);

    const openIdentityModal = useCallback(() => {
        const curName = identity.name || '';
        const curRole = identity.role || 'CTV Sự kiện';
        setTempIdentityName(curName);
        setTempIdentityRole(curRole);
        const matched = effectiveMembers?.find(m => m.name === curName);
        if (matched) {
            setSelectedMemberId(String(matched.id || matched._id));
            setMemberSearchQuery(curName);
        } else {
            setSelectedMemberId('');
            setMemberSearchQuery('');
        }
        setIsIdentityModalOpen(true);
    }, [identity, effectiveMembers]);

    const handleSaveIdentity = (e) => {
        e?.preventDefault();
        if (!tempIdentityName.trim()) return;

        const newId = identity.id || `ctv-${Date.now()}`;
        const newName = tempIdentityName.trim();
        const newRole = tempIdentityRole.trim() || 'CTV Sự kiện';

        setIdentity({
            id: newId,
            name: newName,
            role: newRole,
        });

        if (effectiveEventId) {
            try {
                localStorage.setItem(`air_chat_id_${effectiveEventId}`, newId);
                localStorage.setItem(`air_chat_name_${effectiveEventId}`, newName);
                localStorage.setItem(`air_chat_role_${effectiveEventId}`, newRole);
            } catch (err) {}
        }
        setIsIdentityModalOpen(false);
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        const contentToSend = inputText.trim();
        if ((!contentToSend && !taggedTask) || isSending || !effectiveEventId) return;

        if (!activeCurrentUser && (!identity.name || identity.name === 'Cộng tác viên')) {
            openIdentityModal();
            return;
        }

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const tempMsg = {
            id: tempId,
            _id: tempId,
            senderId: myId,
            senderName: myName,
            senderRole: activeCurrentUser ? (activeCurrentUser.role?.[0] || 'Ban Tổ Chức') : (identity.role || 'CTV Sự kiện'),
            senderType: activeCurrentUser ? 'Internal' : 'Public',
            senderAvatar: activeCurrentUser?.avatar || '',
            content: contentToSend,
            isUrgent: isUrgent,
            isPinned: false,
            replyTo: replyingTo ? {
                id: replyingTo.id || replyingTo._id,
                senderName: replyingTo.senderName,
                content: replyingTo.content,
            } : null,
            taggedTask: taggedTask ? { ...taggedTask } : null,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };

        // Optimistic UI update
        setMessages(prev => [...prev, tempMsg]);
        setInputText('');
        setIsUrgent(false);
        setReplyingTo(null);
        setTaggedTask(null);
        setIsSending(true);
        setIsScrolledUp(false);
        requestAnimationFrame(() => scrollToBottom(true));

        try {
            const tokenParam = shareToken ? `&shareToken=${encodeURIComponent(shareToken)}` : '';
            const res = await fetch(`/api/events/${effectiveEventId}/chat?token=${shareToken}${tokenParam}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToSend,
                    isUrgent: tempMsg.isUrgent,
                    replyTo: tempMsg.replyTo,
                    taggedTask: tempMsg.taggedTask,
                    senderName: tempMsg.senderName,
                    senderRole: tempMsg.senderRole,
                    senderId: tempMsg.senderId,
                    shareToken: shareToken || '',
                }),
            });
            const data = await res.json();
            if (res.ok && data.success && data.message) {
                const savedMsg = data.message;
                lastMessageIdRef.current = savedMsg.id || savedMsg._id;
                setMessages(prev => prev.map(m => (m.id === tempMsg.id || m._id === tempMsg.id) ? savedMsg : m));
                setLiveEventUpdates(prev => ({
                    ...prev,
                    [effectiveEventId]: {
                        lastChatMessage: savedMsg,
                        latestMessageTime: savedMsg.createdAt,
                    }
                }));
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempMsg.id && m._id !== tempMsg.id));
                dialog.alert(data.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.', { title: 'Lỗi gửi tin', type: 'danger' });
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id && m._id !== tempMsg.id));
            dialog.alert('Lỗi kết nối mạng khi gửi tin nhắn. Vui lòng kiểm tra lại đường truyền.', { title: 'Mất kết nối', type: 'danger' });
        } finally {
            setIsSending(false);
        }
    };

    const handleTogglePin = async (messageId, currentPinnedState) => {
        if (!effectiveEventId || !messageId) return;
        try {
            const res = await fetch(`/api/events/${effectiveEventId}/chat`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'pin',
                    messageId,
                    isPinned: !currentPinnedState,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPinnedMessage(data.pinnedChatMessage || null);
                setMessages(prev => prev.map(m => {
                    const mId = String(m.id || m._id);
                    if (mId === String(messageId)) {
                        return { ...m, isPinned: !currentPinnedState };
                    }
                    if (!currentPinnedState) {
                        return { ...m, isPinned: false };
                    }
                    return m;
                }));
            }
        } catch (err) {
            console.error('Error toggling pin:', err);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!effectiveEventId || !messageId) return;
        if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
        try {
            const res = await fetch(`/api/events/${effectiveEventId}/chat?messageId=${messageId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setMessages(prev => prev.filter(m => String(m.id || m._id) !== String(messageId)));
                if (pinnedMessage && String(pinnedMessage.id || pinnedMessage._id) === String(messageId)) {
                    setPinnedMessage(null);
                }
            }
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    };

    const scrollToMessage = useCallback((targetMsgId) => {
        if (!targetMsgId) return;
        const el = document.getElementById(`msg-${targetMsgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(String(targetMsgId));
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2000);
        }
    }, []);

    const handleTaskClick = useCallback((task) => {
        if (!task || !task.id) return;
        window.dispatchEvent(new CustomEvent('air_highlight_roadmap_task', {
            detail: { taskId: task.id }
        }));
    }, []);

    const handleSetReply = (msg) => {
        setReplyingTo(msg);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleOpen = () => {
        setIsOpen(prev => {
            const next = !prev;
            if (next) {
                setUnreadCount(0);
                setHasUrgentUnread(false);
                if (isPublic) {
                    setViewMode('chat');
                }
            }
            return next;
        });
    };

    return (
        <>
            {/* ========================================================= */}
            {/* 1. FLOATING CHAT BUTTON                                    */}
            {/* ========================================================= */}
            <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[998] flex items-center justify-center">
                <button
                    type="button"
                    onClick={toggleOpen}
                    title={isOpen ? 'Đóng hộp thoại chat' : 'Mở kênh chat điều phối sự kiện'}
                    className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 select-none border-2 ${
                        isOpen
                            ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-900 rotate-90'
                            : hasUrgentUnread
                            ? 'bg-rose-600 text-white border-rose-400 hover:bg-rose-700 animate-bounce'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-white/40 hover:scale-105 active:scale-95'
                    }`}
                >
                    {isOpen ? (
                        <IconClose className="w-6 h-6" />
                    ) : (
                        <>
                            <IconChatBubble className="w-7 h-7" />
                            {/* Unread Badge with smooth count-up animation */}
                            {(animatedBadgeCount > 0 || rawBadgeCount > 0) && (
                                <span 
                                    key={animatedBadgeCount}
                                    className={`absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full text-white text-[11px] font-extrabold flex items-center justify-center shadow-md border-2 border-white transition-all transform animate-in zoom-in-75 duration-150 select-none ${
                                        hasUrgentUnread ? 'bg-rose-600 animate-pulse' : 'bg-rose-500'
                                    }`}
                                >
                                    {animatedBadgeCount > 99 ? '99+' : animatedBadgeCount}
                                </span>
                            )}
                        </>
                    )}
                </button>
            </div>

            {/* ========================================================= */}
            {/* 2. CHAT POPUP WINDOW                                      */}
            {/* ========================================================= */}
            {isOpen && (
                <div className="fixed bottom-22 right-4 sm:right-6 z-[999] w-[calc(100vw-32px)] sm:w-[410px] h-[580px] max-h-[calc(100vh-120px)] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
                    
                    {/* CASE A: INBOX / EVENTS LIST VIEW (For Internal / BTC) */}
                    {viewMode === 'list' && !isPublic ? (
                        <ChatChannelListView
                            sortedEvents={sortedEvents}
                            channelSearchQuery={channelSearchQuery}
                            setChannelSearchQuery={setChannelSearchQuery}
                            channelFilterTab={channelFilterTab}
                            setChannelFilterTab={setChannelFilterTab}
                            unreadChannelsCount={unreadChannelsCount}
                            animatedChannelsCount={animatedChannelsCount}
                            onSelectEvent={handleSelectEvent}
                            onClose={toggleOpen}
                        />
                    ) : (
                        /* CASE B: CHAT ROOM DETAIL VIEW */
                        <div className="relative flex flex-col h-full bg-[var(--bg-primary)]">
                            {/* Header */}
                            <div className="relative p-2.5 sm:p-3 bg-blue-600 text-white flex items-center justify-between gap-2 shadow-xs select-none">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    {!isPublic && (
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('list')}
                                            className="p-1.5 rounded-[5px] hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-none bg-transparent shrink-0 transition-colors mr-0.5"
                                            title="Quay lại danh sách sự kiện"
                                        >
                                            <IconChevronLeft className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] text-blue-100 font-semibold tracking-wider uppercase flex items-center gap-1.5 truncate">
                                            <span>{currentActiveEvent?.code || 'Điều Phối'}</span>
                                        </span>
                                        <h4 className="text-xs font-bold text-white truncate m-0 leading-tight">
                                            {currentActiveEvent?.title || event.title || 'Sự kiện'}
                                        </h4>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-1 shrink-0 text-white/90">
                                    {!activeCurrentUser && (
                                        <button
                                            type="button"
                                            onClick={openIdentityModal}
                                            title="Đổi tên hiển thị chat"
                                            className="px-2 py-1 rounded-[5px] bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold border border-white/30 flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                            <IconUsers className="w-3.5 h-3.5" />
                                            <span className="max-w-[80px] truncate">{myName}</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={toggleOpen}
                                        className="p-1.5 rounded-[5px] hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-none bg-transparent transition-colors"
                                        title="Đóng chat"
                                    >
                                        <IconClose className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Pinned Message Banner */}
                            {pinnedMessage && (
                                <div className="p-2 px-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 text-xs">
                                    <div
                                        onClick={() => scrollToMessage(pinnedMessage.id || pinnedMessage._id)}
                                        className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity"
                                    >
                                        <IconPin className="w-4 h-4 text-amber-600 dark:text-amber-400 rotate-45 shrink-0" />
                                        <div className="flex flex-col min-w-0">
                                            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                                                <span>Ghim bởi {pinnedMessage.senderName}</span>
                                                {pinnedMessage.senderRole && (
                                                    <span>• {pinnedMessage.senderRole}</span>
                                                )}
                                            </div>
                                            <p className="text-amber-900 dark:text-amber-200 line-clamp-1 m-0 text-xs font-medium">
                                                {pinnedMessage.content}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePin(pinnedMessage.id || pinnedMessage._id, true)}
                                        title="Bỏ ghim tin này"
                                        className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-300 p-1 rounded-[5px] border-none bg-transparent cursor-pointer shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Message Stream Area */}
                            <div
                                ref={messageContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col bg-[var(--bg-primary)] relative"
                            >
                                {/* Load earlier messages button */}
                                {hasMoreMessages && (
                                    <div className="flex justify-center mb-2.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleLoadMoreMessages}
                                            disabled={loadingMore}
                                            className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--bg-secondary)] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-[var(--border-color)] hover:border-blue-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                    <span>Đang tải tin cũ hơn...</span>
                                                </>
                                            ) : (
                                                <span>↑ Tải tin nhắn cũ hơn</span>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Loading older message history in background when 1st preview message is already shown */}
                                {loadingMessages && messages.length > 0 && !hasMoreMessages && (
                                    <div className="flex items-center justify-center py-2 text-[11px] text-[var(--text-secondary)] gap-1.5 animate-pulse shrink-0">
                                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        <span>Đang tải lịch sử tin nhắn...</span>
                                    </div>
                                )}

                                {loadingMessages && messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] text-xs gap-2 py-10">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        <span>Đang tải tin nhắn...</span>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] text-xs gap-2 py-12 text-center">
                                        <div className="w-12 h-12 rounded-[5px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                                            <IconChatBubble className="w-6 h-6" />
                                        </div>
                                        <p className="font-semibold text-sm text-[var(--text-primary)] m-0">Chưa có tin nhắn nào</p>
                                        <p className="max-w-[240px] text-[11px] text-[var(--text-secondary)] m-0">
                                            Kênh chat nội bộ cho sự kiện {currentActiveEvent?.code || event.code}. Hãy gửi tin nhắn đầu tiên để bắt đầu điều phối!
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const msgId = String(msg.id || msg._id || index);
                                        const msgSenderId = String(msg.senderId || '');
                                        const currentUserId = String(myId || '');
                                        const isMe =
                                            (activeCurrentUser && msgSenderId && (msgSenderId === currentUserId || msg.senderName === myName)) ||
                                            (!activeCurrentUser && msg.senderName === (identity.name || 'CTV') && msg.senderRole === (identity.role || 'CTV Sự kiện'));

                                        const showDateDivider =
                                            index === 0 ||
                                            new Date(msg.createdAt).toDateString() !==
                                                new Date(messages[index - 1].createdAt).toDateString();

                                        const prevMsg = index > 0 ? messages[index - 1] : null;
                                        const isSameSenderAsPrev = prevMsg && (
                                            (msgSenderId && prevMsg.senderId && String(msgSenderId) === String(prevMsg.senderId)) ||
                                            (msg.senderName && prevMsg.senderName && msg.senderName === prevMsg.senderName)
                                        ) && !showDateDivider;

                                        const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                                        const isNextDateDifferent = nextMsg && (new Date(msg.createdAt).toDateString() !== new Date(nextMsg.createdAt).toDateString());
                                        const isSameSenderAsNext = nextMsg && (
                                            (msgSenderId && nextMsg.senderId && String(msgSenderId) === String(nextMsg.senderId)) ||
                                            (msg.senderName && nextMsg.senderName && msg.senderName === nextMsg.senderName)
                                        ) && !isNextDateDifferent;

                                        return (
                                            <ChatMessageItem
                                                key={msgId}
                                                msg={msg}
                                                index={index}
                                                isMe={isMe}
                                                isSameSenderAsPrev={isSameSenderAsPrev}
                                                isSameSenderAsNext={isSameSenderAsNext}
                                                showDateDivider={showDateDivider}
                                                isHighlighted={highlightedMessageId === msgId}
                                                activeMenuMessageId={activeMenuMessageId}
                                                setActiveMenuMessageId={setActiveMenuMessageId}
                                                onReply={handleSetReply}
                                                onTogglePin={handleTogglePin}
                                                onDelete={handleDeleteMessage}
                                                onImageClick={(url) => setActiveLightboxImg(url)}
                                                onScrollToMessage={scrollToMessage}
                                                onTaskClick={handleTaskClick}
                                                isBtcUser={isBtcUser}
                                                canDelete={Boolean(isMe || activeCurrentUser?.role?.includes('Admin') || activeCurrentUser?.role?.includes('Academic'))}
                                            />
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Floating "Scroll to latest message" button */}
                            <ScrollToBottomButton
                                visible={isScrolledUp}
                                onClick={() => scrollToBottom(true)}
                                unreadCount={unreadCount}
                            />

                            {/* Reply Indicator Bar */}
                            {replyingTo && (
                                <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <IconReply className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span className="text-[11px] text-[var(--text-secondary)] truncate">
                                            Đang trả lời <strong className="text-blue-600">{replyingTo.senderName}</strong>: {replyingTo.content}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReplyingTo(null)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-none bg-transparent cursor-pointer p-0.5"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Tagged Task Attachment preview chip */}
                            {taggedTask && (
                                <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2 text-xs animate-in fade-in duration-100">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <IconTree className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span className="text-[11px] text-blue-700 dark:text-blue-300 truncate">
                                            Đang gắn task: <strong>{taggedTask.name}</strong> ({taggedTask.phaseName || 'Lộ trình'})
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setTaggedTask(null)}
                                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border-none bg-transparent cursor-pointer p-0.5 text-xs"
                                        title="Gỡ task đính kèm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Input form */}
                            <form
                                onSubmit={handleSendMessage}
                                className="p-2.5 sm:p-3 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex flex-col gap-2"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        {/* Important Message toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setIsUrgent(prev => !prev)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[11px] font-bold border transition-colors cursor-pointer ${
                                                isUrgent
                                                    ? 'bg-rose-600 border-rose-600 text-white animate-pulse shadow-xs'
                                                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-600 hover:border-rose-300'
                                            }`}
                                            title="Bật chế độ tin nhắn Quan trọng (tin nhắn màu đỏ)"
                                        >
                                            <span>Quan trọng</span>
                                        </button>

                                        {/* Tag Roadmap Task Button */}
                                        <button
                                            type="button"
                                            onClick={() => setIsTaskPickerOpen(true)}
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[11px] font-bold border transition-colors cursor-pointer ${
                                                taggedTask
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600 hover:border-blue-300'
                                            }`}
                                            title="Gắn thẻ Task từ Cây Lộ Trình vào tin nhắn này"
                                        >
                                            <IconTree className="w-3.5 h-3.5" />
                                            <span>{taggedTask ? 'Đã gắn task' : 'Gắn Task'}</span>
                                        </button>
                                    </div>

                                    <div className="text-[10px] text-[var(--text-secondary)] truncate">
                                        Gửi: <strong className="text-[var(--text-primary)]">{myName}</strong>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <textarea
                                        ref={textareaRef}
                                        value={inputText}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setInputText(val);
                                            if (val.endsWith('#') || val === '#') {
                                                setIsTaskPickerOpen(true);
                                            }
                                        }}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        placeholder={
                                            isUrgent
                                                ? 'Nhập tin nhắn quan trọng (gõ # để gắn Task)...'
                                                : 'Nhập tin nhắn (Enter để gửi, gõ # để gắn Task)...'
                                        }
                                        className={`w-full resize-none px-3 py-2 text-xs rounded-[5px] border focus:outline-none focus:ring-2 max-h-24 ${
                                            isUrgent
                                                ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 focus:ring-rose-500 placeholder:text-rose-400'
                                                : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-blue-500'
                                        }`}
                                    />

                                    <button
                                        type="submit"
                                        disabled={(!inputText.trim() && !taggedTask) || isSending}
                                        className={`p-2.5 rounded-[5px] text-white border-none cursor-pointer flex items-center justify-center shrink-0 transition-all ${
                                            isUrgent
                                                ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-40'
                                                : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-40'
                                        }`}
                                        title="Gửi tin nhắn"
                                    >
                                        <IconSend className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* 3. CTV IDENTITY SETUP MODAL                               */}
            {/* ========================================================= */}
            <ChatIdentityModal
                isOpen={isIdentityModalOpen}
                onClose={() => setIsIdentityModalOpen(false)}
                members={effectiveMembers}
                filteredMembers={filteredMembers}
                tempIdentityName={tempIdentityName}
                setTempIdentityName={setTempIdentityName}
                tempIdentityRole={tempIdentityRole}
                setTempIdentityRole={setTempIdentityRole}
                selectedMemberId={selectedMemberId}
                setSelectedMemberId={setSelectedMemberId}
                memberSearchQuery={memberSearchQuery}
                setMemberSearchQuery={setMemberSearchQuery}
                isMemberDropdownOpen={isMemberDropdownOpen}
                setIsMemberDropdownOpen={setIsMemberDropdownOpen}
                onSaveIdentity={handleSaveIdentity}
            />

            {/* ========================================================= */}
            {/* 4. TASK MENTION PICKER MODAL                              */}
            {/* ========================================================= */}
            <TaskMentionPickerModal
                isOpen={isTaskPickerOpen}
                onClose={() => setIsTaskPickerOpen(false)}
                roadmap={effectiveRoadmap}
                onSelectTask={(task) => {
                    setTaggedTask(task);
                    setInputText(prev => prev.endsWith('#') ? prev.slice(0, -1) : prev);
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                    }
                }}
            />

            {/* ========================================================= */}
            {/* 5. IMAGE LIGHTBOX ZOOM                                    */}
            {/* ========================================================= */}
            <ChatImageLightbox
                imageUrl={activeLightboxImg}
                onClose={() => setActiveLightboxImg(null)}
            />
        </>
    );
}
