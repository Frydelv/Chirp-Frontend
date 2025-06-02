<script>
    import { onMount, tick } from 'svelte';
    import { writable, get } from 'svelte/store';
    import Sidebar from '$lib/Sidebar.svelte';
    import '$lib/global.css';
    import { env } from '$env/dynamic/public';
    import { socketStore } from '$lib/stores/socket.js';

    let SERVER_URL = env.PUBLIC_SERVER_URL;
    let messages = writable([]);
    let currentPage = 1;
    let chatId = '';
    let loading = writable(false);
    let canLoadMore = writable(true);
    let isSending = writable(false);
    let newMessage = '';
    let token = '';
    let chatContainer;
    let showSidebar = writable(false);
    let isDesktop = writable(false);

    function scrollToBottom() {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    async function fetchMessages(page = 1, initialLoad = false) {
        loading.set(true);
        try {
            const res = await fetch(`${SERVER_URL}/v1/message/read?cid=${chatId}&p=${page}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (data.messages.length === 0) {
                canLoadMore.set(false);
            } else {
                const fetchedMessages = data.messages;

                if (initialLoad) {
                    messages.set(fetchedMessages);
                    await tick();
                    scrollToBottom();
                } else {
                    const previousHeight = chatContainer.scrollHeight;
                    messages.update(current => [...fetchedMessages, ...current]); 
                    await tick();
                    const newHeight = chatContainer.scrollHeight;
                    chatContainer.scrollTop = newHeight - previousHeight;
                }

                currentPage = page;
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            loading.set(false);
        }
    }

    async function sendMessage() {
        if (!newMessage.trim()) return;
        isSending.set(true);
        try {
            const res = await fetch(`${SERVER_URL}/v1/message/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chatId, content: newMessage })
            });
            const data = await res.json();

            if (data.messageId) {
                newMessage = '';
                await fetchMessages(1, true);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            isSending.set(false);
        }
    }

    function handleScroll() {
        if (chatContainer && chatContainer.scrollTop === 0 && $canLoadMore) {
            fetchMessages(currentPage + 1);
        }
    }

    function setupSocket() {
        socketStore.subscribe(socket => {
            if (!socket) return;

            socket.on('receiveMessage', async (msg) => {
                if (msg.chatId !== chatId) return;
                
                messages.update(current => {
                    const messageExists = current.some(m => m.mid === msg.messageId);
                    if (messageExists) return current;

                    const messageObj = {
                        ...msg,
                        mid: msg.messageId,
                        cnt: msg.content,
                        createdAt: msg.timestamp,
                        y: false
                    };
                    return [...current, messageObj];
                });
                await tick();
                scrollToBottom();
            });
        });
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);

        if (diffSeconds < 60) return 'just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    onMount(() => {
        chatId = window.location.pathname.split('/').pop();
        token = localStorage.getItem('token');
        fetchMessages(1, true);
        setupSocket();

        const updateScreenWidth = () => {
            isDesktop.set(window.innerWidth >= 776);
            showSidebar.set(window.innerWidth >= 776);
        };

        updateScreenWidth();
        window.addEventListener('resize', updateScreenWidth);

        return () => {
            window.removeEventListener('resize', updateScreenWidth);
        };
    });
</script>

<div class="chat-wrapper">
    {#if $showSidebar && !$isDesktop}
        <div class="sidebar-fullscreen">
            <Sidebar on:close={() => showSidebar.set(false)} />
            <button class="close-sidebar" on:click={() => showSidebar.set(false)}>✕</button>
        </div>
    {/if}

    {#if $isDesktop}
        <Sidebar />
    {/if}

    <div class="chat-container" bind:this={chatContainer} on:scroll={handleScroll}>
        <div class="chat-content">
            {#if $loading}
                <p class="loading">Loading more messages...</p>
            {/if}
            {#each $messages as msg}
                <div class="message-row {msg.y ? 'my-message' : 'other-message'}">
                    {#if !msg.y}
                        <div class="message-group">
                            <img class="avatar" src="{SERVER_URL}/default.png" alt="pfp">
                            <div class="message-content">
                                <div class="meta">
                                    <span class="display-name">{msg.displayName}</span>
                                    <span class="timestamp">{formatTimestamp(msg.createdAt)}</span>
                                </div>
                                <div class="bubble">{msg.cnt}</div>
                            </div>
                        </div>
                    {:else}
                        <div class="message-content">
                            <div class="meta right">
                                <span class="timestamp">{formatTimestamp(msg.createdAt)}</span>
                            </div>
                            <div class="bubble">{msg.cnt}</div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="send-message">
            <textarea
                bind:value={newMessage}
                placeholder="Type a message..."
                on:keydown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                }}
            ></textarea>
            <button on:click={sendMessage} disabled={$isSending}>Send</button>
        </div>
    </div>
</div>

<style>
    .chat-wrapper {
        display: flex;
        height: 100vh;
    }

    .chat-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        background-color: #2c2c2c;
        overflow-y: auto;
    }

    .chat-content {
        flex-grow: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
    }

    .message-row {
        display: flex;
        margin-bottom: 16px;
    }

    .message-group {
        display: flex;
        align-items: flex-start;
    }

    .message-content {
        display: flex;
        flex-direction: column;
    }

    .my-message {
        justify-content: flex-end;
    }

    .other-message {
        justify-content: flex-start;
    }

    .bubble {
        padding: 10px;
        border-radius: 8px;
        max-width: 60%;
        word-break: break-word;
    }

    .my-message .bubble {
        background-color: #1e1e1e;
        color: white;
    }

    .other-message .bubble {
        background-color: #1e1e1e;
        color: white;
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 16px;
    }

    .meta {
        font-size: 0.9em;
        color: #dcddde;
        margin-bottom: 4px;
        font-weight: 500;
        display: flex;
        justify-content: space-between;
    }

    .timestamp {
        font-size: 0.8em;
        color: #aaa;
        margin-left: 8px;
    }

    .right {
        justify-content: flex-end;
    }

    .send-message {
        padding: 10px;
        background-color: #1c1c1c;
        display: flex;
        align-items: center;
    }

    textarea {
        flex-grow: 1;
        padding: 10px;
        margin-right: 10px;
        border-radius: 5px;
        border: none;
        background-color: #333;
        color: white;
        resize: none;
    }

    button {
        padding: 10px 20px;
        background-color: #3c3c3c;
        border: none;
        color: white;
        cursor: pointer;
        border-radius: 5px;
    }

    button:disabled {
        background-color: #777;
        cursor: not-allowed;
    }

    .loading {
        text-align: center;
        color: #aaa;
        font-size: 0.9em;
        margin-bottom: 10px;
    }
</style>
