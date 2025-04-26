import { PlayerStore } from '../stores/PlayerStore';
import './chat.css';
import './styles/chat-header.css';
import './styles/chat-input.css';
import './styles/chat-message.css';
import { AIMessage } from './ai/AIMessageTypes';
import { marked } from 'marked';
import { trackQuestEvent } from '../quests/engine/trackQuestEvent';
import './ai/styles/ai-tool-response.css';

// Configure marked for safe rendering
marked.setOptions({
    gfm: true,
    breaks: true,
    silent: true,
});

export interface ChatMessage {
    isSystem: boolean
    playerId: string;
    message: string;
    timestamp: number;
    playerName?: string;
    isAI?: boolean;
    toolResponse?: HTMLElement;
    isStreaming?: boolean;
    isMarkdown?: boolean;
    isTool?: boolean;
    toolName?: string;
}

export interface SystemMessage {
    isSystem: true
    message: string;
    timestamp: number;
}

export class ChatUI {
    private chatContainer!: HTMLElement;
    private chatInput!: HTMLInputElement;
    private chatForm!: HTMLFormElement;
    private messagesContainer!: HTMLElement;
    private chatBubble!: HTMLElement;
    private isVisible: boolean;
    private messages: (ChatMessage | SystemMessage)[] = [];
    private onSendMessage: (message: string) => void;
    private onSendAIMessage?: (message: string) => void;
    private currentFilter: 'ALL' | 'Players' | 'AI' = 'Players';
    private unreadCount: number = 0;
    private unreadPlayerMessages: number = 0; // Track unread player messages separately
    private onChangeName: (newName: string) => Promise<boolean>;
    private isModalOpen: boolean = false;
    private isUserScrolling: boolean = false;
    private lastScrollTop: number = 0;
    private scrollTimeout: any = null;
    private streamingMessageId: string | null = null;

    constructor(onChangeName: (newName: string) => Promise<boolean>, onSendMessage: (message: string) => void, onSendAIMessage?: (message: string) => void) {
        this.onChangeName = onChangeName;
        this.onSendMessage = onSendMessage;
        this.onSendAIMessage = onSendAIMessage;
        this.isVisible = window.innerWidth >= 768;
        this.createUI();
        this.setupEventListeners();

        // Initialize chat with welcome message after a short delay
        // This ensures UI is fully ready
        // setTimeout(() => {
        //     this.initializeWithWelcome();
        // }, 1000);
    }

    // /**
    //  * Initialize chat with welcome message
    //  */
    // private initializeWithWelcome(): void {
    //     // Only proceed if we have AI message handler
    //     if (!this.onSendAIMessage) return;

    //     // Switch to AI tab
    //     this.setFilter('AI');

    //     // Make chat visible
    //     if (!this.isVisible) {
    //         this.toggle();
    //     }

    //     // Send the welcome messag
    //     this.onSendAIMessage("Give me a good introduction of how I play this game and give me 1 really cool places on earth that has amazing and tall buildings. Keep answer very short and concise. Max 4 sentences");
    // }

    private createUI(): void {
        // Create chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = `chat-container ${this.isVisible ? 'visible' : ''}`;

        // Create header with filters
        const header = document.createElement('div');
        header.className = 'chat-header';

        const filterTabs = document.createElement('div');
        filterTabs.className = 'filter-tabs';
        filterTabs.innerHTML = `
      <button class="filter-tab ai ${this.currentFilter === 'AI' ? 'active' : ''}" data-filter="AI">&#x1F916; Ask AI Glenn</button>
      <button class="filter-tab ${this.currentFilter === 'Players' ? 'active' : ''}" data-filter="Players">
        Players
        <span class="player-messages-badge">${this.unreadPlayerMessages > 0 ? this.unreadPlayerMessages : ''}</span>
      </button>
      <button class="filter-tab ${this.currentFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">System</button>
    `;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'header-buttons';

        // Add name change button
        const nameChangeButton = document.createElement('button');
        nameChangeButton.className = 'name-change-button';
        nameChangeButton.innerHTML = '👤 Change Name';
        nameChangeButton.title = 'Change Name';

        // Add click handler directly when creating the button
        nameChangeButton.addEventListener('click', () => {
            this.showNameChangeModal();
        });

        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '×';

        buttonContainer.appendChild(nameChangeButton);
        buttonContainer.appendChild(closeButton);

        header.appendChild(filterTabs);
        header.appendChild(buttonContainer);
        this.chatContainer.appendChild(header);

        // Create messages container
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.className = 'messages-container';
        this.chatContainer.appendChild(this.messagesContainer);

        // Create input form
        this.chatForm = document.createElement('form');
        this.chatForm.className = 'chat-input-container';

        // Create an input wrapper div to hold both input and button
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'chat-input-wrapper';

        // Create input
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.placeholder = 'Type a message...';
        this.chatInput.className = 'chat-input';

        // Create send button
        const sendButton = document.createElement('button');
        sendButton.type = 'submit';
        sendButton.className = 'chat-send-button';
        sendButton.innerHTML = 'Send';

        // Add input and button to wrapper
        inputWrapper.appendChild(this.chatInput);
        inputWrapper.appendChild(sendButton);

        // Add wrapper to form
        this.chatForm.appendChild(inputWrapper);

        this.chatContainer.appendChild(this.chatForm);

        // Create chat bubble
        this.chatBubble = document.createElement('div');
        this.chatBubble.className = 'chat-bubble';
        this.chatBubble.innerHTML = '💬';

        // Add notification badge (initially hidden)
        const badge = document.createElement('div');
        badge.className = 'unread-badge';
        badge.style.display = 'none';
        this.chatBubble.appendChild(badge);

        // Add to document
        document.body.appendChild(this.chatContainer);
        document.body.appendChild(this.chatBubble);

        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 600);

        // Set initial visibility
        this.chatBubble.style.display = this.isVisible ? 'none' : 'flex';

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .header-buttons {
                display: flex;
                gap: 8px;
            }

            .name-change-button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 4px 8px;
                font-size: 12px;
                opacity: 0.8;
                transition: opacity 0.2s;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .name-change-button:hover {
                opacity: 1;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }

            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 200000;
                animation: fadeIn 0.2s ease;
            }

            .name-change-modal {
                background-color: #222;
                border-radius: 10px;
                padding: 20px;
                width: 300px;
                z-index: 200000;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }

            .name-change-modal h3 {
                margin-top: 0;
                color: white;
            }

            .name-change-input {
                width: 100%;
                padding: 8px;
                margin: 10px 0;
                border-radius: 4px;
                border: 1px solid #444;
                background-color: #333;
                color: white;
            }

            .name-change-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 15px;
            }

            .name-change-buttons button {
                padding: 8px 12px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
            }

            .name-change-buttons button.cancel {
                background-color: #555;
                color: white;
            }

            .name-change-buttons button.confirm {
                background-color: #4a6da7;
                color: white;
            }

            .name-change-error {
                color: #ff6b6b;
                font-size: 0.9em;
                margin-top: 5px;
                min-height: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    private setupEventListeners(): void {
        // Filter tabs
        const filterTabs = this.chatContainer.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = (e.target as HTMLElement).dataset.filter as 'ALL' | 'Players' | 'AI';
                this.setFilter(filter);
            });
        });

        // Close button
        const closeButton = this.chatContainer.querySelector('.close-button');
        closeButton?.addEventListener('click', () => this.toggle());

        // Chat bubble
        this.chatBubble.addEventListener('click', () => this.toggle());

        // Form submission
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Close chat when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.chatInput.blur(); // Remove focus from input
                this.toggle();
            }
        });

        // Add scroll event listener to messages container
        this.messagesContainer.addEventListener('scroll', () => {
            // Clear any existing timeout
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }

            // User is actively scrolling
            this.isUserScrolling = true;

            // Save current scroll position
            this.lastScrollTop = this.messagesContainer.scrollTop;

            // Reset the scrolling flag after 2 seconds of no scrolling
            this.scrollTimeout = setTimeout(() => {
                this.isUserScrolling = false;
            }, 2000);
        });
    }

    private setFilter(filter: 'ALL' | 'Players' | 'AI'): void {
        this.currentFilter = filter;

        // Update UI
        const tabs = this.chatContainer.querySelectorAll('.filter-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-filter') === filter);
        });

        // Reset unread count when switching to Players tab
        if (filter === 'Players') {
            this.resetUnreadPlayerMessages();
        }

        // Update placeholder based on filter
        if (filter === 'AI') {
            this.chatInput.placeholder = 'Ask AI something...';
        } else {
            this.chatInput.placeholder = 'Type a message...';
        }

        this.renderMessages();
    }

    /**
     * Escapes HTML special characters to prevent XSS attacks
     */
    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Render message content with optional Markdown support
     */
    private renderMessageContent(message: string, isMarkdown: boolean = false): string {
        if (!isMarkdown) {
            return this.escapeHtml(message);
        }
        
        try {
            // Parse and render markdown - make sure we get a string not a Promise
            const parsed = marked.parse(message);
            return typeof parsed === 'string' ? parsed : this.escapeHtml(message);
        } catch (e) {
            console.error('Error parsing markdown:', e);
            return this.escapeHtml(message);
        }
    }

    private renderMessages(): void {
        const filteredMessages = this.messages.filter(msg => {
            if (!msg) return true;
            
            if (this.currentFilter === 'ALL') {
                // Show only system messages and regular player messages (not AI)
                return msg.isSystem || (!msg.isSystem && !(msg as ChatMessage).isAI);
            }
            
            if (this.currentFilter === 'AI') {
                // Only show messages that are marked as part of AI conversations
                return !msg.isSystem && (msg as ChatMessage).isAI === true;
            }
            
            if (this.currentFilter === 'Players') {
                // Only show player messages (not AI and not system)
                return !msg.isSystem && !(msg as ChatMessage).isAI;
            }
            
            return true;
        });

        // Check if we need to show inspiration prompts
        if (this.currentFilter === 'AI' && filteredMessages.length === 0) {
            this.renderAIInspirationPrompts();
            return;
        }

        this.messagesContainer.innerHTML = filteredMessages.map(msg => {
            if (!msg.isSystem) {
                const chatMsg = msg as ChatMessage;
                // Escape player name
                const safeName = this.escapeHtml(chatMsg.playerName || 'Unknown Player');
                
                // Special handling for tool messages with empty content but with toolResponse
                const displayContent = (!chatMsg.message && chatMsg.isTool && chatMsg.toolResponse) 
                    ? '' // Don't show any placeholder for empty tool content
                    : this.renderMessageContent(chatMsg.message || '', chatMsg.isMarkdown);
                
                // Add AI class if it's an AI message
                const aiClass = chatMsg.isAI ? 'ai' : '';
                // Add tool class if it's a tool message
                const toolClass = chatMsg.isTool ? 'tool' : '';
                const streamingClass = chatMsg.isStreaming ? 'streaming' : '';
                const markdownClass = chatMsg.isMarkdown ? 'markdown' : '';
                const messageId = `msg-${chatMsg.timestamp}`;
                
                // For tool messages, use a more compact layout
                let content = '';
                if (chatMsg.isTool && chatMsg.toolResponse) {
                    content = `
              <div class="message ${aiClass} ${toolClass} ${streamingClass} ${markdownClass}" id="${messageId}">
                <div class="message-header">
                  <span class="player-name">${safeName}</span>
                  <span class="timestamp">${this.formatTime(chatMsg.timestamp)}</span>
                </div>
                <div class="tool-response-container" id="tool-response-${chatMsg.timestamp}"></div>
              </div>`;
                } else {
                    content = `
              <div class="message ${aiClass} ${toolClass} ${streamingClass} ${markdownClass}" id="${messageId}">
                <div class="message-header">
                  <span class="player-name">${safeName}</span>
                  <span class="timestamp">${this.formatTime(chatMsg.timestamp)}</span>
                </div>
                <div class="message-content">${displayContent}</div>`;
                    
                    // Add tool response if any
                    if (chatMsg.toolResponse) {
                        content += `<div class="tool-response-container" id="tool-response-${chatMsg.timestamp}"></div>`;
                    }
                    
                    content += `</div>`;
                }
                return content;
            } else {
                // Also escape system messages
                const safeMessage = this.escapeHtml(msg.message);
                
                return `
          <div class="message system">
            <div class="message-content">${safeMessage}</div>
          </div>
        `;
            }
        }).join('');

        // Add tool responses to their containers
        filteredMessages.forEach(msg => {
            if (!msg.isSystem && (msg as ChatMessage).toolResponse) {
                const chatMsg = msg as ChatMessage;
                const container = document.getElementById(`tool-response-${chatMsg.timestamp}`);
                if (container && chatMsg.toolResponse) {
                    container.innerHTML = '';
                    container.appendChild(chatMsg.toolResponse);
                }
            }
        });

        // Track current streaming message ID if any
        this.streamingMessageId = null;
        const streamingMsg = this.messages.find(msg => 
            !msg.isSystem && (msg as ChatMessage).isStreaming
        ) as ChatMessage | undefined;
        
        if (streamingMsg) {
            this.streamingMessageId = `msg-${streamingMsg.timestamp}`;
        }
    }

    /**
     * Renders inspiration prompts when there are no AI messages
     */
    private renderAIInspirationPrompts(): void {
        // Define the inspiration prompts
        const inspirationPrompts = [
            "Top 5 most beautiful places on earth",
            "Most beautiful building in the world",
            "Best driving routes in this game"
        ];

        // Create the prompt container
        let html = `
            <div class="ai-inspiration-container">
                <div class="ai-prompt-header">Try asking AI about:</div>
        `;

        // Add each prompt as a clickable button
        inspirationPrompts.forEach(prompt => {
            html += `
                <div class="ai-prompt-item" data-prompt="${this.escapeHtml(prompt)}">
                    ${this.escapeHtml(prompt)}
                </div>
            `;
        });

        html += `</div>`;
        
        // Set the HTML
        this.messagesContainer.innerHTML = html;
        
        // Add click handlers
        const promptItems = this.messagesContainer.querySelectorAll('.ai-prompt-item');
        promptItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const prompt = target.getAttribute('data-prompt');
                if (prompt && this.onSendAIMessage) {
                    this.onSendAIMessage(prompt);
                }
            });
        });

        // Add styles for inspiration prompts
        this.addInspirationStyles();
    }

    /**
     * Adds CSS styles for inspiration prompts
     */
    private addInspirationStyles(): void {
        // Check if styles already exist
        if (document.getElementById('ai-inspiration-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'ai-inspiration-styles';
        style.textContent = `
            .ai-inspiration-container {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 20px;
                align-items: center;
                justify-content: center;
                height: 100%;
            }
            
            .ai-prompt-header {
                font-size: 16px;
                color: #ffffff;
                margin-bottom: 10px;
                text-align: center;
            }
            
            .ai-prompt-item {
                background-color: rgba(74, 109, 167, 0.2);
                border: 1px solid rgba(74, 109, 167, 0.6);
                border-radius: 12px;
                padding: 12px 16px;
                font-size: 14px;
                color: #ffffff;
                cursor: pointer;
                transition: all 0.2s ease;
                max-width: 300px;
                width: 100%;
                text-align: center;
            }
            
            .ai-prompt-item:hover {
                background-color: rgba(74, 109, 167, 0.4);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            
            .ai-prompt-item:active {
                transform: translateY(0);
                background-color: rgba(74, 109, 167, 0.6);
            }
        `;
        
        document.head.appendChild(style);
    }

    private formatTime(timestamp: number): string {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private sendMessage(): void {
        const message = this.chatInput.value.trim();
        if (message === '') return;

        this.chatInput.value = '';
        
        // Route message based on current filter
        if (this.currentFilter === 'AI' && this.onSendAIMessage) {
            trackQuestEvent('AI_MESSAGE_SENT');
            this.onSendAIMessage(message);
        } else {
            this.onSendMessage(message);
        }
        
        // Track message sent for quest
        trackQuestEvent('CHAT_MESSAGE_SENT');

        this.chatInput.focus();
    }

    public toggle(): void {
        this.isVisible = !this.isVisible;
        this.chatContainer.classList.toggle('visible', this.isVisible);
        
        if (this.isVisible) {
            trackQuestEvent('CHAT_OPEN');
        }
        this.chatBubble.style.display = this.isVisible ? 'none' : 'flex';

        if (this.isVisible) {
            const badge = this.chatBubble.querySelector('.unread-badge') as HTMLElement;
            if (badge) {
                badge.style.display = 'none';
            }
            this.unreadCount = 0;
            
            // Don't reset unread player messages since they should persist until the tab is clicked
            
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                this.chatInput.focus()
            }, 300);
        }
    }

    private shouldAutoScroll(): boolean {
        if (!this.isVisible) return true; // Always scroll if chat is hidden
        if (this.isUserScrolling) return false; // Don't scroll if user is actively scrolling

        // Check if user is near bottom (within 100px)
        const { scrollTop, scrollHeight, clientHeight } = this.messagesContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        return isNearBottom;
    }

    public addMessage(message: ChatMessage, forceShow: boolean = false): void {
        if ((message.playerId === PlayerStore.getPlayerId() && !forceShow) || !message.message) {
            return;
        }

        this.messages.push(message);

        this.renderMessages();

        // Auto-scroll only if we should
        if (forceShow || this.shouldAutoScroll()) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        // Process notifications only for messages from other players
        if (message.playerId !== PlayerStore.getPlayerId()) {
            // Play sound for new messages from others
            this.playMessageSound();

            // Only increment unread count if it's not a system message and the chat is not visible
            if (!this.isVisible && !message.isSystem) {
                this.unreadCount++;
                this.updateNotificationBadge();
            }
            
            // If it's a regular player message (not AI or system) and we're not in Players tab
            if (!message.isAI && !message.isSystem && this.currentFilter !== 'Players') {
                this.unreadPlayerMessages++;
                this.updatePlayerMessagesBadge();
            }
        }
    }

    /**
     * Add an AI message from the AI assistant
     */
    public addAIMessage(message: AIMessage, forceShow: boolean = false): void {
        // If this is a final (non-streaming) message, remove any streaming messages first
        if (!message.isStreaming) {
            this.messages = this.messages.filter(msg => 
                msg.isSystem || !(msg as ChatMessage).isStreaming
            );
        }
        
        // Determine the player name based on the role
        let playerName = '';
        if (message.role === 'user') {
            playerName = message.playerName || PlayerStore.getPlayerName();
        } else if (message.role === 'tool') {
            // For tool responses, use a more compact name
            playerName = message.toolName || 'Tool';
        } else {
            playerName = 'AI Assistant';
        }
        
        const chatMessage: ChatMessage = {
            isSystem: false,
            playerId: message.role === 'user' ? PlayerStore.getPlayerId() : 'ai-assistant',
            playerName: playerName,
            message: message.content,
            timestamp: message.timestamp,
            isAI: message.role === 'assistant' || message.role === 'tool',
            isStreaming: message.isStreaming,
            isMarkdown: message.isMarkdown ?? true, // Use Markdown if specified, default to true
            isTool: message.isTool || false,
            toolName: message.toolName
        };
        
        this.addMessage(chatMessage, forceShow);
    }

    /**
     * Update a streaming AI message
     */
    public updateStreamingMessage(message: AIMessage): void {
        // First check if we already have a streaming message to update
        const existingStreamingMsgIndex = this.messages.findIndex(msg => 
            !msg.isSystem && (msg as ChatMessage).isStreaming
        );
        
        if (existingStreamingMsgIndex >= 0) {
            // Update existing streaming message
            const chatMsg = this.messages[existingStreamingMsgIndex] as ChatMessage;
            chatMsg.message = message.content;
            chatMsg.isMarkdown = message.isMarkdown ?? true;
            
            // Update DOM if element exists
            if (this.streamingMessageId) {
                const element = document.getElementById(this.streamingMessageId);
                if (element) {
                    const content = element.querySelector('.message-content');
                    if (content) {
                        // For streaming messages, decide whether to render as Markdown
                        if (chatMsg.isMarkdown) {
                            // When streaming with Markdown, render the content
                            content.innerHTML = this.renderMessageContent(message.content, true);
                        } else {
                            // Otherwise use plain text for performance
                            content.textContent = message.content;
                        }
                    
                        return;
                    }
                }
            }
            
            // If we couldn't update the DOM directly, re-render
            this.renderMessages();
        } else {
            // Add a new streaming message
            const chatMessage: ChatMessage = {
                isSystem: false,
                playerId: 'ai-assistant',
                playerName: 'AI Assistant',
                message: message.content,
                timestamp: message.timestamp,
                isAI: true,
                isStreaming: true,
                isMarkdown: message.isMarkdown ?? true // Use Markdown if specified, default to true
            };
            
            // Add to the end of the list
            this.messages.push(chatMessage);
            
            this.renderMessages();
        }
    }

    /**
     * Add a tool response to an AI message
     */
    public addToolResponse(_timestamp: number, element: HTMLElement): void {
        // Find the most recent tool message to attach this to
        // Reverse search through messages to find the most recent tool message without a response
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const message = this.messages[i] as ChatMessage;
            if (!message.isSystem && 
                message.isTool && 
                message.toolResponse === undefined) {
                
                message.toolResponse = element;
                this.renderMessages();
                
                return;
            }
        }
    }

    public addSystemMessage(message: string): void {
        const systemMessage: SystemMessage = {
            isSystem: true,
            message,
            timestamp: Date.now()
        };

        this.messages.push(systemMessage);

        this.renderMessages();

        // Auto-scroll only if we should
        if (this.shouldAutoScroll()) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        // Don't increment unread count for system messages
        // Previous code removed to prevent notification badges for system messages
    }

    private updateNotificationBadge(): void {
        const badge = this.chatBubble.querySelector('.unread-badge') as HTMLElement;
        if (badge) {
            badge.style.display = 'flex';
            badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount.toString();
        }
    }

    public addMessages(messages: ChatMessage[]): void {
        const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
        // Still load a limited initial set for performance, but we want to keep 
        // all messages in memory after that
        const initialMessages = sortedMessages.slice(-20); // Load only the most recent 20 initially

        initialMessages.forEach(message => {
            this.messages.push(message);
        });

        // Removed message limit code

        this.renderMessages();
    }


    /**
     * Play a notification sound when receiving a message
     */
    private playMessageSound(): void {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5

            gainNode.gain.setValueAtTime(0.07, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Silently fail if audio doesn't work
            console.log('Audio notification failed', e);
        }
    }

    private showNameChangeModal(): void {
        if (!this.onChangeName || this.isModalOpen) {
            return;
        }

        this.isModalOpen = true;
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'name-change-modal';

        modal.innerHTML = `
            <h3>Change Your Name</h3>
            <input type="text" class="name-change-input" placeholder="Enter new name" value="${PlayerStore.getPlayerName()}" maxlength="20">
            <div class="name-change-error"></div>
            <div class="name-change-buttons">
                <button class="cancel">Cancel</button>
                <button class="confirm">Change Name</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const input = modal.querySelector('.name-change-input') as HTMLInputElement;
        const errorDiv = modal.querySelector('.name-change-error') as HTMLElement;
        const confirmBtn = modal.querySelector('.confirm') as HTMLButtonElement;
        const cancelBtn = modal.querySelector('.cancel') as HTMLButtonElement;

        const closeModal = () => {
            overlay.remove();
            this.chatInput.blur(); // Remove focus from input
            this.isModalOpen = false;
        };

        cancelBtn.addEventListener('click', closeModal);

        confirmBtn.addEventListener('click', async () => {
            const newName = input.value.trim();
            errorDiv.textContent = '';

            if (!newName) {
                errorDiv.textContent = 'Name cannot be empty';
                return;
            }

            if (newName.length < 2) {
                errorDiv.textContent = 'Name must be at least 2 characters';
                return;
            }

            if (!/^[a-zA-Z0-9-_]+$/.test(newName)) {
                errorDiv.textContent = 'Name can only contain letters, numbers, hyphens, and underscores';
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Saving...';

            const success = await this.onChangeName(newName);

            if (success) {
                this.addSystemMessage(`You changed your name to ${newName}`);
                trackQuestEvent('NAME_CHANGED');
                closeModal();
            } else {
                errorDiv.textContent = 'Failed to change name (might be taken)';
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Change Name';
            }
        });

        input.focus();
        input.select();
    }

    /**
     * Update the player messages badge
     */
    private updatePlayerMessagesBadge(): void {
        if (!this.chatContainer) return;
        
        const badge = this.chatContainer.querySelector('.player-messages-badge') as HTMLElement;
        if (badge) {
            if (this.unreadPlayerMessages > 0) {
                badge.textContent = this.unreadPlayerMessages > 99 ? '99+' : this.unreadPlayerMessages.toString();
            } else {
                badge.textContent = '';
            }
        }
    }

    /**
     * Reset unread player messages counter
     */
    private resetUnreadPlayerMessages(): void {
        this.unreadPlayerMessages = 0;
        this.updatePlayerMessagesBadge();
    }
} 