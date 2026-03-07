<template>
  <div class="chat-layout">
    <TechBackground />
    <!-- 左侧导航栏 (Desktop) -->
    <div class="sidebar hidden-mobile">
      <div class="logo-area">
        <el-avatar 
          :size="48" 
          :src="getAvatarUrl(userStore.user?.avatar)" 
          class="user-avatar" 
          @click="showProfile = true"
        />
      </div>
      <div class="nav-menu">
        <div 
          class="nav-item" 
          :class="{ active: currentTab === 'chat' }"
          @click="currentTab = 'chat'"
        >
          <div class="icon-wrapper">
             <el-icon><ChatDotRound /></el-icon>
             <div class="badge" v-if="unreadCounts.chat > 0">{{ unreadCounts.chat > 99 ? '99+' : unreadCounts.chat }}</div>
          </div>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentTab === 'contacts' }"
          @click="currentTab = 'contacts'"
        >
          <div class="icon-wrapper">
             <el-icon><User /></el-icon>
             <div class="badge" v-if="unreadCounts.contacts > 0">{{ unreadCounts.contacts > 99 ? '99+' : unreadCounts.contacts }}</div>
          </div>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentTab === 'moments' }"
          @click="currentTab = 'moments'"
        >
          <div class="icon-wrapper">
             <el-icon><Star /></el-icon>
             <div class="badge" v-if="unreadCounts.moments > 0">{{ unreadCounts.moments > 99 ? '99+' : unreadCounts.moments }}</div>
          </div>
        </div>
        <div 
          class="nav-item" 
          :class="{ active: currentTab === 'settings' }"
          @click="showSettings = true"
        >
          <el-icon><Setting /></el-icon>
        </div>
      </div>
      <div class="bottom-actions">
        <div class="nav-item theme-switch" @click="themeStore.toggleTheme">
          <el-icon v-if="themeStore.isDark"><Moon /></el-icon>
          <el-icon v-else><Sunny /></el-icon>
        </div>
        <div class="nav-item logout" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
        </div>
      </div>
    </div>
    
    <!-- 二级侧边栏 (聊天列表/联系人列表) -->
    <div class="sub-sidebar" :class="{ 'hidden-mobile': isMobileChatOpen }">
      <div class="search-header">
        <div class="search-wrapper">
          <el-icon class="search-icon"><Search /></el-icon>
          <input type="text" v-model="searchQuery" placeholder="搜索..." class="search-input" @keydown.enter="handleGlobalSearch" />
        </div>
        <div class="add-btn" @click="showAddFriend = true">
          <el-icon><Plus /></el-icon>
        </div>
      </div>

      <!-- 聊天列表 -->
      <Transition name="tab-fade-desktop" mode="out-in">
        <div v-if="currentTab === 'chat'" class="list-container" key="chat">
          <!-- New Group Button in Chat List -->
           <div class="list-item create-group-item" @click="showCreateGroup = true" style="justify-content: center; color: var(--accent-color);">
               <el-icon><Plus /></el-icon> <span style="margin-left: 5px;">发起群聊</span>
           </div>

          <div 
            class="list-item"
            :class="{ active: currentChatUser && currentChatUser.id === 6 }"
            @click="startChat({ id: 6, nickname: '炘灏科技', username: 'ai_assistant', avatar: 'https://img-11.stickers.cloud/packs/ace730b5-9735-4ddc-aeb9-6cf873d61d35/webp/ac90cb34-f2c7-430e-b2e5-2bbf6a6c813b.webp' })"
          >
          <div class="item-avatar">
            <el-avatar :size="40" shape="square" :src="getAvatarUrl('https://img-11.stickers.cloud/packs/ace730b5-9735-4ddc-aeb9-6cf873d61d35/webp/ac90cb34-f2c7-430e-b2e5-2bbf6a6c813b.webp')" />
          </div>
          <div class="item-content">
            <div class="item-top">
              <span class="item-title">炘灏科技</span>
              <span class="item-time"></span>
            </div>
            <div class="item-subtitle">欢迎来到炘灏科技</div>
          </div>
        </div>
        
        <!-- Chat Sessions (Unified) -->
        <div 
          v-for="item in sortedChatList" 
          :key="item.type + '-' + item.id"
          class="list-item"
          :class="{ active: (item.type === 'group' && currentChatGroup && currentChatGroup.id === item.id) || (item.type === 'friend' && currentChatUser && currentChatUser.id === item.id), pinned: item.pinned }"
          @click="item.type === 'group' ? startGroupChat(item.data) : startChat(item.data)"
          @contextmenu.prevent="showChatContextMenu($event, item)"
          v-longpress="(e) => showChatContextMenu(e, item)"
        >
          <div class="item-avatar">
             <div class="icon-wrapper">
                <el-avatar :size="40" :src="getAvatarUrl(item.avatar)" :icon="item.type === 'group' ? 'UserFilled' : ''" />
                <div class="badge" v-if="item.unread > 0">{{ item.unread > 99 ? '99+' : item.unread }}</div>
             </div>
          </div>
          <div class="item-content">
            <div class="item-top">
              <span class="item-title">{{ item.name }}</span>
              <span class="item-time" v-if="item.lastActiveTime">{{ formatTime(item.lastActiveTime) }}</span>
            </div>
            <div class="item-subtitle" v-if="item.type === 'group'">{{ item.data.members.length }}人</div>
            <div class="item-subtitle" v-else>{{ item.signature || '暂无签名' }}</div>
          </div>
          <div v-if="item.pinned" class="pin-icon" style="font-size: 12px; color: var(--accent-color); margin-left: 5px;"><el-icon><Top /></el-icon></div>
        </div>
      </div>

      <!-- 联系人列表 -->
      <div v-else-if="currentTab === 'contacts'" class="list-container" key="contacts">
        <!-- New Friends / Requests -->
        <div v-if="friendRequests.length > 0" class="section-title">新朋友</div>
        <div v-for="req in friendRequests" :key="'friend-'+req.id" class="list-item request-item">
            <div class="item-avatar">
                <el-avatar :size="36" :src="getAvatarUrl(req.sender.avatar)" />
            </div>
            <div class="item-content">
                <div class="item-title">{{ req.sender.nickname || req.sender.username }}</div>
                <div class="item-subtitle" v-if="req.reason" style="font-size: 11px; color: var(--text-secondary);">{{ req.reason }}</div>
                <div class="request-actions">
                    <el-button type="success" circle size="small" @click="handleAccept(req.id)"><el-icon><Check /></el-icon></el-button>
                    <el-button type="danger" circle size="small" @click="handleReject(req.id)"><el-icon><Close /></el-icon></el-button>
                </div>
            </div>
        </div>

        <!-- Group Invitations -->
        <div v-if="groupRequests.length > 0" class="section-title">群通知</div>
        <div v-for="req in groupRequests" :key="'group-'+req.id" class="list-item request-item" style="background-color: rgba(64, 158, 255, 0.1);">
            <div class="item-avatar">
                <el-avatar :size="36" :src="getAvatarUrl(req.group.avatar)" />
            </div>
            <div class="item-content">
                <div class="item-title">{{ req.group.name }}</div>
                <div class="item-subtitle" style="font-size: 11px; color: var(--text-secondary);">{{ req.reason }}</div>
                <div class="request-actions">
                    <el-button type="success" circle size="small" @click="handleAcceptGroup(req.id)"><el-icon><Check /></el-icon></el-button>
                    <el-button type="danger" circle size="small" @click="handleRejectGroup(req.id)"><el-icon><Close /></el-icon></el-button>
                </div>
            </div>
        </div>

        <div class="section-title">我的好友</div>
        <div v-if="friendList.length === 0" class="empty-state">
          <span>暂无联系人</span>
        </div>
        <div v-else v-for="friend in friendList.filter(f => {
            if (!searchQuery.trim()) return true
            const q = searchQuery.toLowerCase()
            return (f.nickname && f.nickname.toLowerCase().includes(q)) || (f.username && f.username.toLowerCase().includes(q))
        })" :key="friend.id" class="list-item" @click="startChat(friend)" @contextmenu.prevent="showContactContextMenu($event, friend)" v-longpress="(e) => showContactContextMenu(e, friend)">
            <div class="item-avatar">
                <el-avatar :size="40" :src="getAvatarUrl(friend.avatar)" @click.stop="showUserProfile(friend)" />
            </div>
            <div class="item-content">
                <div class="item-title">{{ friend.nickname || friend.username }}</div>
                <div class="item-subtitle">{{ friend.signature || '暂无签名' }}</div>
            </div>
        </div>
      </div>

      <!-- 云聊空间 -->
      <div v-else-if="currentTab === 'moments'" class="list-container moments-container" key="moments">
        <div class="moments-header">
            <el-icon class="show-mobile" @click="currentTab = 'chat'" style="margin-right: 10px; cursor: pointer;"><ArrowLeft /></el-icon>
            <span>云聊空间</span>
            <el-button circle type="primary" @click="showMomentsPublish = true"><el-icon><Camera /></el-icon></el-button>
        </div>
        
        <div class="moments-list-scroll">
            <div v-if="momentsList.length === 0" class="empty-state">
              <span>暂无动态</span>
            </div>
            <div v-else v-for="moment in momentsList" :key="moment.id" class="moment-card">
                <div class="moment-header">
                    <el-avatar :size="40" :src="getAvatarUrl(moment.user.avatar)" />
                    <div class="moment-user">
                        <span class="nickname">{{ moment.user.nickname }}</span>
                        <span class="time">{{ new Date(moment.createTime).toLocaleString() }}</span>
                    </div>
                    <div class="moment-actions" v-if="moment.user.id === userStore.user.id" style="margin-left: auto;">
                        <el-button link type="danger" size="small" @click="handleDeleteMoment(moment)">删除</el-button>
                    </div>
                </div>
                <div class="moment-content">{{ moment.content }}</div>
                <div class="moment-media" v-if="moment.media && moment.media.length">
                    <template v-for="(url, idx) in moment.media" :key="idx">
                        <el-image 
                            v-if="isImageUrl(url)"
                            :src="getImageUrl(url)" 
                            :preview-src-list="moment.media.filter(isImageUrl).map(i => getImageUrl(i))" 
                            fit="cover" 
                            class="moment-img" 
                            :initial-index="idx"
                            :preview-teleported="true"
                            :zoom-rate="1.2"
                            :max-scale="7"
                            :min-scale="0.2"
                        >
                            <template #error>
                                <div class="image-slot">
                                    <el-icon><Picture /></el-icon>
                                </div>
                            </template>
                        </el-image>
                        <video 
                            v-else
                            :src="getImageUrl(url)" 
                            controls
                            class="moment-video"
                        />
                    </template>
                </div>
                
                <!-- Likes & Comments Actions -->
                <div class="moment-footer">
                    <div class="action-bar">
                        <div class="action-btn" @click="handleLike(moment)" :class="{ active: moment.likedUserIds && moment.likedUserIds.includes(userStore.user.id) }">
                            <el-icon><Star /></el-icon>
                            <span>{{ moment.likedUserIds ? moment.likedUserIds.length : 0 }}</span>
                        </div>
                        <div class="action-btn" @click="commentInputs[moment.id] = commentInputs[moment.id] === undefined ? '' : commentInputs[moment.id]">
                            <el-icon><Comment /></el-icon>
                            <span>{{ moment.comments ? moment.comments.length : 0 }}</span>
                        </div>
                    </div>
                    
                    <!-- Comments List -->
                    <div class="comments-section" v-if="moment.comments && moment.comments.length">
                        <div v-for="comment in moment.comments" :key="comment.id" class="comment-item" @click="prepareReply(moment, comment.user)">
                            <span class="comment-user">{{ comment.user.nickname }}</span>
                            <span v-if="comment.replyToUser" class="reply-text"> 回复 <span class="comment-user">{{ comment.replyToUser.nickname }}</span></span>
                            <span class="comment-content">: {{ comment.content }}</span>
                        </div>
                    </div>
                    
                    <!-- Comment Input -->
                    <div class="comment-input-area" v-if="commentInputs[moment.id] !== undefined">
                        <el-input 
                            v-model="commentInputs[moment.id]" 
                            :placeholder="replyTargets[moment.id] ? `回复 ${replyTargets[moment.id].nickname}...` : '评论...'"
                            size="small"
                            @keydown.enter="handleComment(moment)"
                        >
                            <template #append>
                                <el-button 
                                    @click="handleComment(moment)" 
                                    class="moment-send-btn"
                                    :style="{ 
                                        backgroundColor: themeStore.isDark ? '#10a37f' : '#000000', 
                                        color: '#ffffff',
                                        border: 'none'
                                    }"
                                >发送</el-button>
                            </template>
                        </el-input>
                        <div v-if="replyTargets[moment.id]" style="font-size: 10px; color: var(--text-secondary); margin-top: 2px; cursor: pointer;" @click="replyTargets[moment.id] = null">
                            取消回复
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      </Transition>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="main-area" :class="{ 'mobile-open': isMobileChatOpen }">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <div class="header-left">
            <el-button v-if="isMobileChatOpen" icon="ArrowLeft" circle text class="back-btn show-mobile" @click="isMobileChatOpen = false" />
            <div class="header-info">
            <div style="display: flex; align-items: center; gap: 5px;">
                <h3 v-if="currentChatGroup">{{ currentChatGroup.name }} ({{ currentChatGroup.members.length }})</h3>
                <h3 v-else>{{ currentChatUser ? (currentChatUser.nickname || currentChatUser.username) : '炘灏科技' }}</h3>
            </div>
            <span class="tag" v-if="!currentChatUser && !currentChatGroup">官方团队</span>
            </div>
        </div>
        <div class="header-actions">
          <el-button v-if="currentChatGroup" circle text @click="showGroupInfo = true; selectedFriendsForGroup = []"><el-icon><MoreFilled /></el-icon></el-button>
          <el-button v-else circle text @click="showSettings = true"><el-icon><MoreFilled /></el-icon></el-button>
        </div>
      </div>

      <!-- 消息记录 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" class="message-row" :class="[msg.direction, { 'recall-row': msg.isRecall }]">
          <!-- Received Avatar -->
          <el-avatar 
            v-if="msg.direction === 'received' && !msg.isRecall" 
            :size="36" 
            shape="square" 
            :src="currentChatGroup ? getAvatarUrl(msg.sender?.avatar) : (currentChatUser ? getAvatarUrl(currentChatUser.avatar) : getAvatarUrl('https://raw.githubusercontent.com/MSDOS-Signal/mybackend/refs/heads/main/uploads/ai_avatar.jpg'))" 
            class="msg-avatar received-avatar" 
            @click="showUserProfile(currentChatGroup ? msg.sender : currentChatUser)"
            @error="console.log('头像加载失败:', $event.target.src)"
          />
          
          <!-- Content Bubble -->
          <div class="message-content" :class="{ 'recall-container': msg.isRecall }" @contextmenu.prevent="showContextMenu($event, index)" v-longpress="(e) => showContextMenu(e, index)">
            <div v-if="currentChatGroup && msg.direction === 'received' && !msg.isRecall" style="font-size: 10px; color: var(--text-secondary); margin-bottom: 2px;">{{ msg.sender?.nickname || msg.sender?.username }}</div>
            
            <div v-if="msg.isRecall" class="recall-tip">
                {{ msg.sender.id === userStore.user.id ? '你' : (msg.sender.nickname || msg.sender.username) }} 撤回了一条消息
            </div>
            
            <div v-else>
                <!-- Reply Context -->
                <div v-if="msg.replyToMessage" class="reply-context">
                    <span class="reply-user">{{ msg.replyToMessage.sender.nickname || msg.replyToMessage.sender.username }}:</span>
                    <span class="reply-content">{{ msg.replyToMessage.type === 'image' ? '[图片]' : msg.replyToMessage.content }}</span>
                </div>

                <div v-if="msg.image" class="image-bubble">
                    <div style="position: relative;">
                        <el-image 
                            :src="getImageUrl(msg.image)" 
                            :preview-src-list="[getImageUrl(msg.image)]" 
                            fit="cover" 
                            class="msg-image" 
                            lazy>
                            <template #placeholder>
                                <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: var(--bg-hover);">
                                    <el-icon class="is-loading"><Loading /></el-icon>
                                </div>
                            </template>
                            <template #error>
                                <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: var(--bg-hover); color: var(--text-secondary);">
                                    <el-icon><Picture /></el-icon>
                                    <span style="margin-left: 5px; font-size: 12px;">加载失败</span>
                                </div>
                            </template>
                        </el-image>
                    </div>
                </div>
                <div v-else-if="msg.contentType === 'video'" class="video-bubble">
                    <div style="position: relative;">
                        <video :src="getImageUrl(msg.content)" controls class="msg-video" style="max-width: 250px; max-height: 250px; border-radius: 8px;" preload="metadata" playsinline></video>
                    </div>
                </div>
                <div v-else-if="msg.contentType === 'audio'" class="audio-bubble">
                    <audio :src="getImageUrl(msg.content)" controls class="msg-audio" style="max-width: 250px; height: 40px;" preload="metadata"></audio>
                </div>
                <div v-else-if="msg.contentType === 'file'" class="file-bubble">
                    <div style="position: relative;">
                        <a :href="getFileUrl(msg.content)" target="_blank" class="file-link" :download="getFileName(msg.content)" @click="handleFileClick($event, msg.content)">
                            <div class="file-icon">
                                <el-icon><Document /></el-icon>
                            </div>
                            <div class="file-info">
                                <div class="file-name">{{ getFileName(msg.content) }}</div>
                                <div class="file-size">点击下载</div>
                            </div>
                            <el-icon class="file-download"><Download /></el-icon>
                        </a>
                    </div>
                </div>
                <!-- Markdown Rendering for Text Messages -->
                <div v-else ref="messageBubbles" class="bubble" :class="{ 'markdown-body ai-bubble': !msg.sender || msg.sender.username === 'ai' || msg.sender.username === 'ai_assistant' }" v-html="md.render(msg.content)"></div>
                
                <div class="msg-footer">
                    <span class="msg-time">{{ formatTime(msg.createTime) }}</span>
                </div>
            </div>
          </div>

          <!-- Sent Avatar -->
          <el-avatar 
            v-if="msg.direction === 'sent' && !msg.isRecall" 
            :size="36" 
            shape="square" 
            :src="getAvatarUrl(userStore.user?.avatar)" 
            class="msg-avatar sent-avatar" 
            @click="showUserProfile(userStore.user)"
          />
        </div>
      </div>

      <!-- 输入框区域 -->
      <div class="input-section">
        <!-- Reply Target Indicator -->
        <div v-if="replyMessageTarget" class="reply-target-bar">
            <span>回复 {{ replyMessageTarget.sender.nickname || replyMessageTarget.sender.username }}: {{ replyMessageTarget.content }}</span>
            <el-icon class="close-btn" @click="replyMessageTarget = null"><Close /></el-icon>
        </div>
        
        <div class="toolbar">
          <el-popover placement="top" :width="300" trigger="click" :disabled="isMeMuted">
            <template #reference>
              <div class="tool-icon" :class="{ disabled: isMeMuted }"><el-icon><Emoji /></el-icon></div>
            </template>
            <div class="emoji-grid">
                <span v-for="e in emojiList" :key="e" class="emoji-item" @click="insertEmoji(e)">{{ e }}</span>
            </div>
          </el-popover>
          
          <el-tooltip content="发送文件" placement="top" :show-after="500">
            <div class="tool-icon" :class="{ disabled: isMeMuted }" @click="handleFileUpload"><el-icon><Folder /></el-icon></div>
          </el-tooltip>
          
          <el-tooltip content="发送图片" placement="top" :show-after="500">
            <div class="tool-icon" :class="{ disabled: isMeMuted }" @click="handleImageUpload"><el-icon><Picture /></el-icon></div>
          </el-tooltip>
          
          <el-tooltip content="发送视频" placement="top" :show-after="500">
            <div class="tool-icon" :class="{ disabled: isMeMuted }" @click="handleVideoUpload"><el-icon><VideoCamera /></el-icon></div>
          </el-tooltip>
          
          <el-tooltip content="发送语音" placement="top" :show-after="500">
            <div class="tool-icon" :class="{ disabled: isMeMuted }" @click="handleVoiceClick"><el-icon><Microphone /></el-icon></div>
          </el-tooltip>
        </div>
        
        <input type="file" ref="fileInput" style="display: none" @change="handleFileChange" />
        <input type="file" ref="imageInput" style="display: none" accept="image/*" @change="handleImageChange" />
        <input type="file" ref="videoInput" style="display: none" accept="video/*" @change="handleVideoChange" />

        <textarea 
          :value="inputMessage"
          class="message-input" 
          :placeholder="isMeMuted ? '您已被禁言...' : '发送消息...'"
          :disabled="isMeMuted"
          @keydown.enter.prevent="handleSend"
          @focus="handleInputFocus"
          @input="handleInput"
        ></textarea>

        <div class="input-footer">
          <span class="hint hidden-mobile">按 Enter 发送</span>
          <button class="send-btn" @click="handleSend" :disabled="!canSend">
            发送
          </button>
        </div>
      </div>
    </div>

    <!-- Message Context Menu (Moved outside message loop) -->
    <div class="msg-context-menu" v-if="contextMenuVisible !== null" :style="menuStyle">
        <div class="action-item" @click="handleCopyMessage(messages[contextMenuVisible])" v-if="!messages[contextMenuVisible]?.image && messages[contextMenuVisible]?.contentType !== 'audio' && messages[contextMenuVisible]?.contentType !== 'video' && messages[contextMenuVisible]?.contentType !== 'file'">复制</div>
        <div class="action-item" @click="handleReplyMessage(messages[contextMenuVisible])">回复</div>
        <div class="action-item" v-if="!messages[contextMenuVisible]?.isRecall && ((messages[contextMenuVisible]?.direction === 'sent' && new Date() - new Date(messages[contextMenuVisible]?.createTime) < 120000) || (currentChatGroup && currentChatGroup.owner.id === userStore.user.id))" @click="handleRecall(messages[contextMenuVisible])">撤回</div>
        <div class="action-item" @click="handleDeleteMessageLocal(contextMenuVisible)">删除</div>
    </div>
    
    <!-- Chat List Context Menu -->
    <div class="msg-context-menu" v-if="chatContextMenuVisible" :style="{ top: chatContextMenuY + 'px', left: chatContextMenuX + 'px' }">
        <div class="action-item" v-if="selectedChatItem?.type === 'group' || selectedChatItem?.type === 'friend'" @click="handlePinChat">{{ selectedChatItem?.pinned ? '取消置顶' : '置顶聊天' }}</div>
    </div>
    
    <!-- Friend List Context Menu (Separate) -->
    <div class="msg-context-menu" v-if="contactContextMenuVisible" :style="{ top: contactContextMenuY + 'px', left: contactContextMenuX + 'px' }">
        <div class="action-item" @click="handleDeleteContact" style="color: #ef4444;">删除好友</div>
    </div>

    <!-- 底部导航栏 (Mobile) -->
    <div class="bottom-nav show-mobile" v-if="!isMobileChatOpen">
        <div class="nav-item" :class="{ active: currentTab === 'chat' }" @click="currentTab = 'chat'">
            <div class="icon-wrapper">
                <el-icon><ChatDotRound /></el-icon>
                <div class="badge" v-if="unreadCounts.chat > 0">{{ unreadCounts.chat > 99 ? '99+' : unreadCounts.chat }}</div>
            </div>
            <span>聊天</span>
        </div>
        <div class="nav-item" :class="{ active: currentTab === 'contacts' }" @click="currentTab = 'contacts'">
            <div class="icon-wrapper">
                <el-icon><User /></el-icon>
                <div class="badge" v-if="unreadCounts.contacts > 0">{{ unreadCounts.contacts > 99 ? '99+' : unreadCounts.contacts }}</div>
            </div>
            <span>通讯录</span>
        </div>
        <div class="nav-item" :class="{ active: currentTab === 'moments' }" @click="currentTab = 'moments'">
            <div class="icon-wrapper">
                <el-icon><Star /></el-icon>
                <div class="badge" v-if="unreadCounts.moments > 0">{{ unreadCounts.moments > 99 ? '99+' : unreadCounts.moments }}</div>
            </div>
            <span>云聊空间</span>
        </div>
        <div class="nav-item" :class="{ active: currentTab === 'settings' }" @click="showSettings = true">
            <el-avatar :size="24" :src="getAvatarUrl(userStore.user?.avatar)" />
            <span>我</span>
        </div>
    </div>

    <!-- 个人资料弹窗 -->
    <el-dialog v-model="showProfile" title="个人资料" width="400px" class="custom-dialog">
      <div class="profile-content">
        <div class="profile-header">
          <el-avatar :size="80" :src="getAvatarUrl(editForm.avatar) || getAvatarUrl(userStore.user?.avatar)" class="profile-avatar" />
          <el-button link type="primary" @click="triggerAvatarUpload">更换头像</el-button>
          <input type="file" ref="avatarInput" style="display: none" accept="image/*" @change="handleAvatarChange" />
        </div>
        <el-form :model="editForm" label-position="top">
          <el-form-item label="昵称">
            <el-input v-model="editForm.nickname" />
          </el-form-item>
          <el-form-item label="个性签名">
            <el-input v-model="editForm.signature" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="性别">
            <el-radio-group v-model="editForm.gender">
              <el-radio :value="1">男</el-radio>
              <el-radio :value="2">女</el-radio>
              <el-radio :value="0">保密</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="danger" @click="handleLogout" style="float: left">退出登录</el-button>
          <el-button @click="showProfile = false">取消</el-button>
          <el-button type="primary" @click="handleSaveProfile" :loading="saving">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户信息查看弹窗 -->
    <el-dialog v-model="profileUserVisible" title="" width="350px" class="profile-view-dialog" :close-on-click-modal="true">
        <div class="profile-view-content" v-if="profileUser">
            <div class="profile-view-header">
                <el-avatar :size="80" :src="getAvatarUrl(profileUser.avatar)" class="profile-view-avatar" />
                <div class="profile-view-info">
                    <div class="profile-view-nickname">{{ profileUser.nickname || profileUser.username }}</div>
                    <div class="profile-view-username">ID: {{ profileUser.username }}</div>
                    <div class="profile-view-detail">
                        <el-tag :type="profileUser.gender === 1 ? 'success' : (profileUser.gender === 2 ? 'danger' : 'info')" size="small">
                            {{ profileUser.gender === 1 ? '男' : (profileUser.gender === 2 ? '女' : '保密') }}
                        </el-tag>
                        <span v-if="profileUser.phone !== undefined && profileUser.phone !== null" class="profile-view-phone">{{ formatPhone(profileUser.phone) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </el-dialog>

    <!-- 设置弹窗 -->
    <el-dialog v-model="showSettings" title="设置" width="400px" class="custom-dialog">
        <div class="settings-list">
            <div class="setting-item">
                <span>深色模式</span>
                <el-switch v-model="themeStore.isDark" />
            </div>
            <div class="setting-item">
                <span>消息通知</span>
                <el-switch v-model="notifications" />
            </div>
            <div class="setting-item">
                <span>允许被搜索</span>
                <el-switch v-model="searchable" @change="handleUpdateSettings" />
            </div>
             <div class="setting-item" @click="showProfile = true; showSettings = false">
                <span>编辑个人资料</span>
                <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="setting-item" @click="showAbout = true; showSettings = false">
                <span>关于我们</span>
                <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="setting-item logout-item" @click="handleLogout">
                <span>退出登录</span>
                <el-icon><SwitchButton /></el-icon>
            </div>
        </div>
    </el-dialog>

    <!-- 关于我们弹窗 -->
    <el-dialog v-model="showAbout" title="" width="450px" class="about-dialog" :close-on-click-modal="true">
        <div class="about-content">
            <div class="about-header">
                <h1 class="about-title">炘灏云聊</h1>
                <h2 class="about-subtitle">Xinhao Chat</h2>
                <div class="about-version">V2.0.5</div>
            </div>
            <p class="about-description">人工智能 + 云计算即时聊天软件</p>
            <p class="about-feature">非常简洁</p>
            <div class="about-partner">
                <el-icon><Cloudy /></el-icon>
                <span>阿里云计算合作</span>
            </div>
            <div class="about-author">
                <div class="author-label">作者</div>
                <div class="author-links">
                    <a href="https://github.com/MSDOS-Signal" target="_blank" class="author-link" title="GitHub">
                        <svg viewBox="0 0 24 24" class="github-icon"><path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                    <span class="author-contact" title="QQ">
                        <el-icon><ChatDotRound /></el-icon>
                        <span>3878919117</span>
                    </span>
                    <span class="author-contact" title="微信">
                        <el-icon><ChatLineRound /></el-icon>
                        <span>DXH08060927</span>
                    </span>
                </div>
            </div>
        </div>
    </el-dialog>

    <!-- 添加好友弹窗 -->
    <el-dialog v-model="showAddFriend" title="添加好友" width="400px" class="custom-dialog">
        <el-input v-model="addFriendInput" placeholder="输入用户名搜索" :prefix-icon="Search" @keyup.enter="handleAddFriend" />
        <div class="search-results-list" v-if="searchResults.length > 0">
            <div v-for="user in searchResults" :key="user.id" class="user-item">
                <el-avatar :src="getAvatarUrl(user.avatar)" :size="36" />
                <div class="user-info">
                    <span class="nickname">{{ user.nickname || user.username }}</span>
                    <span class="username">ID: {{ user.username }}</span>
                </div>
                <el-button type="primary" size="small" @click="prepareSendRequest(user)">添加</el-button>
            </div>
        </div>
        <div v-else-if="addFriendInput && !searching && searchResults.length === 0" class="search-result">
            <div class="empty-state" style="padding: 20px 0;">
                <p>未找到用户 "{{ addFriendInput }}"</p>
            </div>
        </div>
    </el-dialog>

    <!-- 申请理由弹窗 -->
    <el-dialog v-model="showRequestReason" title="验证申请" width="400px" class="custom-dialog">
        <el-input v-model="requestReason" placeholder="请输入申请理由" />
        <template #footer>
            <el-button @click="showRequestReason = false">取消</el-button>
            <el-button type="primary" @click="confirmSendRequest">发送</el-button>
        </template>
    </el-dialog>

    <!-- 发布朋友圈弹窗 -->
    <el-dialog v-model="showMomentsPublish" title="发布动态" width="500px" class="custom-dialog">
        <el-input v-model="momentForm.content" type="textarea" :rows="4" placeholder="分享新鲜事..." />
        <div class="upload-area">
            <div class="image-preview" v-for="(item, idx) in momentForm.media" :key="idx">
                <el-image v-if="item.type === 'image'" :src="item.url" fit="cover" class="preview-img" />
                <video v-else :src="item.url" controls class="preview-video" />
                <div class="remove-media" @click="momentForm.media.splice(idx, 1)"><el-icon><Close /></el-icon></div>
            </div>
            <div class="upload-btn" @click="triggerMomentMediaUpload" v-if="momentForm.media.length < 9">
                <el-icon><Plus /></el-icon>
            </div>
        </div>
        <input type="file" ref="momentMediaInput" style="display: none" accept="image/*,video/*" @change="handleMomentMediaChange" multiple />
        <template #footer>
            <el-button @click="showMomentsPublish = false">取消</el-button>
            <el-button type="primary" @click="handlePublishMoment" :loading="saving">发布</el-button>
        </template>
    </el-dialog>

    <!-- 创建群聊弹窗 -->
    <el-dialog v-model="showCreateGroup" title="发起群聊" width="500px" class="custom-dialog">
        <el-input v-model="groupName" placeholder="群名称" style="margin-bottom: 20px;" />
        <div class="friend-selector" style="max-height: 300px; overflow-y: auto;">
            <div class="section-title">选择好友 (至少2人)</div>
            <el-checkbox-group v-model="selectedFriendsForGroup">
                <div v-for="friend in friendList" :key="friend.id" class="friend-select-item" style="padding: 10px; display: flex; align-items: center; border-bottom: 1px solid var(--border-color);">
                    <el-checkbox :label="friend.id" style="margin-right: 10px; width: 20px; height: 20px;" />
                    <el-avatar :size="30" :src="getAvatarUrl(friend.avatar)" style="margin-right: 10px;" />
                    <span class="dialog-friend-name">{{ friend.nickname || friend.username }}</span>
                </div>
            </el-checkbox-group>
        </div>
        <template #footer>
            <el-button @click="showCreateGroup = false">取消</el-button>
            <el-button type="primary" @click="handleCreateGroup">创建 ({{ selectedFriendsForGroup.length }})</el-button>
        </template>
    </el-dialog>

    <!-- 群聊信息/邀请弹窗 -->
    <el-dialog v-model="showGroupInfo" title="群组信息" width="500px" class="custom-dialog">
        <div v-if="currentChatGroup">
            <div class="group-info-header" style="text-align: center; margin-bottom: 20px;">
                 <el-avatar :size="80" :src="getAvatarUrl(editGroupForm.avatar || currentChatGroup.avatar)" style="margin-bottom: 10px;" />
                 <div v-if="currentChatGroup.owner.id === userStore.user.id" style="margin-bottom: 10px;">
                    <el-button link type="primary" @click="triggerGroupAvatarUpload">更换头像</el-button>
                    <input type="file" ref="groupAvatarInput" style="display: none" accept="image/*" @change="handleGroupAvatarChange" />
                 </div>
                 
                 <div v-if="currentChatGroup.owner.id === userStore.user.id">
                     <el-input v-model="editGroupForm.name" placeholder="群名称" style="margin-bottom: 10px;" />
                     <el-input v-model="editGroupForm.description" type="textarea" :rows="2" placeholder="群介绍" style="margin-bottom: 10px;" />
                     <el-button type="primary" size="small" @click="handleUpdateGroup">保存修改</el-button>
                 </div>
                 <div v-else>
                     <h3>{{ currentChatGroup.name }}</h3>
                     <p v-if="currentChatGroup.description" style="color: var(--text-secondary); font-size: 13px;">{{ currentChatGroup.description }}</p>
                 </div>
            </div>

            <p><strong>成员数:</strong> {{ currentChatGroup.members.length }}</p>
            <div class="divider" style="margin: 20px 0; border-bottom: 1px solid var(--border-color);"></div>
            
            <!-- Member List with Management -->
            <div class="section-title">群成员</div>
            <div class="group-members-list" style="max-height: 200px; overflow-y: auto;">
                <div v-for="member in currentChatGroup.members" :key="member.id" class="group-member-item" style="padding: 10px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center;">
                        <el-avatar :size="30" :src="getAvatarUrl(member.avatar)" style="margin-right: 10px;" />
                        <span class="dialog-friend-name">{{ member.nickname || member.username }}</span>
                        <span v-if="member.id === currentChatGroup.owner.id" class="tag" style="margin-left: 5px; font-size: 10px; padding: 2px 4px;">群主</span>
                    </div>
                    
                    <div v-if="currentChatGroup.owner.id === userStore.user.id && member.id !== userStore.user.id" class="member-actions">
                         <div v-if="currentChatGroup.mutedMembers && currentChatGroup.mutedMembers[member.id] && new Date(currentChatGroup.mutedMembers[member.id]) > new Date()">
                            <el-button link type="warning" size="small" @click="handleMuteMember(member, 0)">解除</el-button>
                         </div>
                         <div v-else>
                             <el-dropdown trigger="click" @command="(cmd) => handleMuteMember(member, cmd)">
                                <el-button link type="warning" size="small">禁言</el-button>
                                <template #dropdown>
                                  <el-dropdown-menu>
                                    <el-dropdown-item command="10">10分钟</el-dropdown-item>
                                    <el-dropdown-item command="60">1小时</el-dropdown-item>
                                    <el-dropdown-item command="1440">1天</el-dropdown-item>
                                  </el-dropdown-menu>
                                </template>
                              </el-dropdown>
                         </div>
                          <el-button type="danger" link size="small" @click="handleKickMember(member)">踢出</el-button>
                    </div>
                </div>
            </div>

            <div class="divider" style="margin: 20px 0; border-bottom: 1px solid var(--border-color);"></div>
            <div class="section-title">邀请新成员</div>
             <div class="friend-selector" style="max-height: 200px; overflow-y: auto;">
                <el-checkbox-group v-model="selectedFriendsForGroup">
                    <div v-for="friend in friendList.filter(f => !currentChatGroup.members.some(m => m.id === f.id))" :key="friend.id" class="friend-select-item" style="padding: 10px; display: flex; align-items: center;">
                        <el-checkbox :label="friend.id" style="margin-right: 10px; width: 20px; height: 20px;" />
                        <el-avatar :size="30" :src="getAvatarUrl(friend.avatar)" style="margin-right: 10px;" />
                        <span class="dialog-friend-name">{{ friend.nickname || friend.username }}</span>
                    </div>
                </el-checkbox-group>
                <div v-if="friendList.filter(f => !currentChatGroup.members.some(m => m.id === f.id)).length === 0" style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    没有可邀请的好友
                </div>
            </div>
            
            <div v-if="currentChatGroup.owner.id === userStore.user.id" style="margin-top: 20px; text-align: center;">
                 <el-button type="danger" plain style="width: 100%;" @click="handleDeleteGroup">解散群聊</el-button>
            </div>
        </div>
        <template #footer>
            <el-button @click="showGroupInfo = false">关闭</el-button>
            <el-button type="primary" @click="handleInviteMembers" :disabled="selectedFriendsForGroup.length === 0">邀请</el-button>
        </template>
    </el-dialog>

    <!-- 语音录制弹窗 -->
    <el-dialog v-model="showVoiceRecorder" title="录制语音" width="300px" class="custom-dialog" :close-on-click-modal="false">
        <div style="text-align: center; padding: 20px;">
            <div v-if="!isRecording">
                <el-button type="primary" circle size="large" @click="startRecording" style="width: 80px; height: 80px; font-size: 30px;"><el-icon><Microphone /></el-icon></el-button>
                <p style="margin-top: 10px;">点击开始录制</p>
            </div>
            <div v-else>
                <el-button type="danger" circle size="large" @click="stopRecording" style="width: 80px; height: 80px; font-size: 30px; animation: pulse 1s infinite;"><el-icon><VideoCamera /></el-icon></el-button>
                <p style="margin-top: 10px;">录制中... 点击停止</p>
            </div>
        </div>
        <template #footer>
            <el-button @click="cancelRecording">取消</el-button>
            <el-button type="primary" @click="sendVoice" :disabled="!recordedBlob">发送</el-button>
        </template>
    </el-dialog>

    <!-- File Upload Inputs (Hidden) -->
    <input type="file" ref="fileInput" style="display: none" @change="handleFileChange" />
    <input type="file" ref="imageInput" style="display: none" accept="image/*" @change="handleImageChange" />

    <!-- 头像裁剪弹窗 -->
    <el-dialog v-model="showCropper" title="编辑头像" width="600px" class="custom-dialog">
        <div class="cropper-container" style="height: 400px;">
            <vue-cropper
                ref="cropper"
                :src="cropperImg"
                :aspect-ratio="1"
                preview=".preview"
                :view-mode="1"
                :guides="true"
                :background="false"
                drag-mode="move"
            />
        </div>
        <div class="cropper-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
            <el-button-group>
                <el-button @click="cropper.zoom(0.1)"><el-icon><ZoomIn /></el-icon></el-button>
                <el-button @click="cropper.zoom(-0.1)"><el-icon><ZoomOut /></el-icon></el-button>
                <el-button @click="cropper.rotate(90)"><el-icon><Refresh /></el-icon></el-button>
            </el-button-group>
        </div>
        <template #footer>
            <el-button @click="showCropper = false">取消</el-button>
            <el-button type="primary" @click="handleCropUpload">确认上传</el-button>
        </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, onUpdated, onUnmounted, watch, computed } from 'vue'
import { useUserStore } from '../store/user'
import { useThemeStore } from '../store/theme'
import { useRouter } from 'vue-router'
import { updateUser, searchUsers, uploadFile, sendFriendRequest as apiSendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest, getFriends, deleteFriend, updateSettings, publishMoment, getMoments, likeMoment, commentMoment, deleteMoment, sendMessage, recallMessage, getMessages, createGroup, getMyGroups, inviteGroupMembers, updateGroup, kickMember, muteMember, unmuteMember, deleteGroup, getGroupRequests, acceptGroupRequest, rejectGroupRequest, getUnreadCounts, markRead, pinGroup, pinFriend, sendAiMessage, default as api } from '../api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import TechBackground from '../components/TechBackground.vue'
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
const vLongpress = {
  mounted(el, binding) {
    let timer = null
    const start = (e) => {
      if (e.type === 'click' && e.button !== 0) return
      if (timer === null) {
        timer = setTimeout(() => {
          binding.value(e)
          timer = null
        }, 500)
      }
    }
    const cancel = () => {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    }
    el.addEventListener('mousedown', start)
    el.addEventListener('touchstart', start)
    el.addEventListener('click', cancel)
    el.addEventListener('mouseout', cancel)
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
    el.addEventListener('touchmove', cancel) // Cancel on scroll
  }
}

// ... existing code ...
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // Use a dark theme for code blocks

const md = new MarkdownIt({
    html: false, // Disable HTML tags in source
    xhtmlOut: false, // Use '/' to close single tags (<br />).
    breaks: true, // Convert '\n' in paragraphs to <br>
    langPrefix: 'language-',  // CSS language prefix for fenced blocks. Can be
    linkify: true, // Autoconvert URL-like text to links
    typographer: true,
    quotes: '“”‘’',
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code></pre>';
            } catch (__) { }
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
})

// Element Plus Icons
import { ChatDotRound, User, Setting, SwitchButton, Search, Plus, MoreFilled, Folder, Picture, Moon, Sunny, ArrowRight, ArrowLeft, Star, Check, Close, Camera, Location, Comment, Delete, ZoomIn, ZoomOut, Refresh, Upload, UserFilled, RefreshLeft, Top, VideoCamera, Microphone, Loading } from '@element-plus/icons-vue'
const Emoji = ChatDotRound 

const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()
const currentTab = ref('chat')
const currentChatUser = ref(null) // Defined earlier
const currentChatGroup = ref(null) // Defined earlier
const inputMessage = ref('')
const messagesContainer = ref(null)
const canSend = ref(false)

watch(inputMessage, (newVal) => {
    canSend.value = newVal.trim().length > 0
})
const messageBubbles = ref([])
const showProfile = ref(false)
const showSettings = ref(false)
const showAddFriend = ref(false)
const showRequestReason = ref(false)
const showCropper = ref(false)
const showCreateGroup = ref(false)
const showGroupInfo = ref(false)
const cropperImg = ref('')
const cropper = ref(null)
const requestReason = ref('')
const currentReceiver = ref(null)
const showMomentsPublish = ref(false)
const saving = ref(false)
const notifications = ref(true)
const searchable = ref(userStore.user?.searchable !== false)
const searchQuery = ref('')
const addFriendInput = ref('')
const fileInput = ref(null)
const imageInput = ref(null)
const videoInput = ref(null)
const avatarInput = ref(null)
const momentMediaInput = ref(null)
const searchResults = ref([])
const searching = ref(false)
const friendRequests = ref([])
const groupRequests = ref([])
const friendList = ref([])
const momentsList = ref([])
const groupList = ref([])
const selectedFriendsForGroup = ref([])
const groupName = ref('')
const editGroupForm = reactive({
    name: '',
    description: '',
    avatar: ''
})
const groupAvatarInput = ref(null)

watch(currentChatGroup, (newVal) => {
    if (newVal) {
        editGroupForm.name = newVal.name
        editGroupForm.description = newVal.description || ''
        editGroupForm.avatar = newVal.avatar
    }
})

// Watch cropper image changes and reset cropper
watch(cropperImg, (newVal) => {
    if (newVal && cropper.value) {
        // Destroy old cropper instance
        cropper.value.destroy()
        // Create new cropper instance with new image
        nextTick(() => {
            if (cropper.value) {
                cropper.value.replace(newVal)
            }
        })
    }
})

const momentForm = reactive({
    content: '',
    media: []  // 支持图片和视频 [{type: 'image'|'video', url: string, file: File}]
})
const commentInputs = reactive({}) // Map of momentId -> comment content
const replyTargets = reactive({}) // Map of momentId -> user object (who we are replying to)
const unreadCounts = reactive({
    chat: 0,
    contacts: 0,
    moments: 0,
    bySender: {},
    byGroup: {}
})

let pollInterval = null

const showVoiceRecorder = ref(false)
const isRecording = ref(false)
const recordedBlob = ref(null)
let mediaRecorder = null
let audioChunks = []

const isMeMuted = ref(false)
const profileUser = ref(null) // 显示用户信息的弹窗
const profileUserVisible = ref(false)
const showAbout = ref(false)

watch([currentChatGroup, () => userStore.user], () => {
    checkMuteStatus()
}, { deep: true })

// Polling for mute status check (as websocket might not cover it immediately if not broadcasted)
// Actually we can just check when messages arrive or group updates.
// But we need to check periodally if mute expires.
const checkMuteStatus = () => {
    if (!currentChatGroup.value || !userStore.user) {
        isMeMuted.value = false
        return
    }
    const myId = userStore.user.id
    if (currentChatGroup.value.mutedMembers && currentChatGroup.value.mutedMembers[myId]) {
        const unmuteTime = new Date(currentChatGroup.value.mutedMembers[myId])
        if (unmuteTime > new Date()) {
            isMeMuted.value = true
        } else {
            isMeMuted.value = false
        }
    } else {
        isMeMuted.value = false
    }
}

// Mobile State
const isMobileChatOpen = ref(false)

const messages = ref([
  { type: 'received', content: '欢迎来到炘灏科技！这里是您的专属AI助手体验空间。' },
  { type: 'received', content: '您可以在这里体验极致流畅的即时通讯功能。' }
])

// Edit Form
const editForm = reactive({
  nickname: userStore.user?.nickname || '',
  signature: userStore.user?.signature || '',
  gender: userStore.user?.gender || 0,
  avatar: userStore.user?.avatar || ''
})

watch(() => userStore.user, (newVal) => {
    if(newVal) {
        editForm.nickname = newVal.nickname
        editForm.signature = newVal.signature
        editForm.gender = newVal.gender
        editForm.avatar = newVal.avatar
    }
}, { deep: true })

const sortedChatList = computed(() => {
    const list = []
    // Add groups
    groupList.value.forEach(g => {
        list.push({
            type: 'group',
            id: g.id,
            name: g.name,
            avatar: g.avatar,
            pinned: g.pinned || false,
            lastActiveTime: g.lastActiveTime || g.createTime,
            data: g,
            unread: unreadCounts.byGroup[g.id] || 0
        })
    })
    // Add friends
    friendList.value.forEach(f => {
        list.push({
            type: 'friend',
            id: f.id,
            name: f.nickname || f.username, // Fallback to username if nickname is missing
            avatar: f.avatar,
            pinned: f.pinned || false,
            lastActiveTime: f.lastActiveTime || f.createTime,
            data: f,
            unread: unreadCounts.bySender[f.id] || 0,
            signature: f.signature
        })
    })
    
    // Sort
    const sorted = list.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        const t1 = new Date(a.lastActiveTime).getTime()
        const t2 = new Date(b.lastActiveTime).getTime()
        return t2 - t1
    })

    // Filter by search query (Fuzzy search)
    if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        return sorted.filter(item => {
            const name = item.name ? item.name.toLowerCase() : ''
            const username = item.data.username ? item.data.username.toLowerCase() : ''
            return name.includes(query) || username.includes(query)
        })
    }
    
    return sorted
})

const chatContextMenuVisible = ref(false)
const chatContextMenuX = ref(0)
const chatContextMenuY = ref(0)
const selectedChatItem = ref(null)

const contactContextMenuVisible = ref(false)
const contactContextMenuX = ref(0)
const contactContextMenuY = ref(0)
const selectedContactItem = ref(null)

const showChatContextMenu = (event, item) => {
    selectedChatItem.value = item
    // Use touch event coordinates if available (for mobile)
    const clientX = event.touches ? event.touches[0].clientX : event.clientX
    const clientY = event.touches ? event.touches[0].clientY : event.clientY
    
    chatContextMenuX.value = clientX
    chatContextMenuY.value = clientY
    chatContextMenuVisible.value = true
    contactContextMenuVisible.value = false
    contextMenuVisible.value = null 
}

const showContactContextMenu = (event, friend) => {
    selectedContactItem.value = friend
    // Use touch event coordinates if available (for mobile)
    const clientX = event.touches ? event.touches[0].clientX : event.clientX
    const clientY = event.touches ? event.touches[0].clientY : event.clientY
    
    contactContextMenuX.value = clientX
    contactContextMenuY.value = clientY
    contactContextMenuVisible.value = true
    chatContextMenuVisible.value = false
    contextMenuVisible.value = null
}

const handlePinChat = async () => {
    if (!selectedChatItem.value) return
    const item = selectedChatItem.value
    const newPinned = !item.pinned
    
    try {
        if (item.type === 'group') {
            await pinGroup(item.id, newPinned)
            const g = groupList.value.find(x => x.id === item.id)
            if(g) g.pinned = newPinned
        } else {
            await pinFriend(item.id, newPinned)
            const f = friendList.value.find(x => x.id === item.id)
            if(f) f.pinned = newPinned
        }
        chatContextMenuVisible.value = false
        ElMessage.success(newPinned ? '已置顶' : '已取消置顶')
    } catch (e) {
        ElMessage.error('操作失败')
    }
}

const handlePinContact = async () => {
    if (!selectedContactItem.value) return
    const friend = selectedContactItem.value
    const newPinned = !friend.pinned
    
    try {
        await pinFriend(friend.id, newPinned)
        const f = friendList.value.find(x => x.id === friend.id)
        if(f) f.pinned = newPinned
        contactContextMenuVisible.value = false
        ElMessage.success(newPinned ? '已置顶' : '已取消置顶')
    } catch (e) {
        ElMessage.error('操作失败')
    }
}

const handleDeleteContact = async () => {
    if (!selectedContactItem.value) return
    const friend = selectedContactItem.value
    
    try {
        await ElMessageBox.confirm(`确定要删除好友 ${friend.nickname || friend.username} 吗？删除后将无法发送消息。`, '警告', {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'error'
        })
        
        await deleteFriend(friend.id)
        
        // Update local state
        friendList.value = friendList.value.filter(f => f.id !== friend.id)
        if (currentChatUser.value && currentChatUser.value.id === friend.id) {
            currentChatUser.value = null
            currentTab.value = 'chat'
        }
        
        ElMessage.success('好友已删除')
        contactContextMenuVisible.value = false
    } catch (e) {
        if (e !== 'cancel') ElMessage.error('操作失败: ' + (e.response?.data || e.message))
    }
}

const handleDeleteFriend = async () => {
    // Legacy/Unused
}

// Global click to close
window.addEventListener('click', () => {
    chatContextMenuVisible.value = false
    contactContextMenuVisible.value = false
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const handleChatClick = () => {
    // Default official chat
    currentChatUser.value = null 
    currentChatGroup.value = null
    messages.value = [
        { type: 'received', content: '欢迎来到炘灏科技！这里是您的专属AI助手体验空间。' },
        { type: 'received', content: '您可以在这里体验极致流畅的即时通讯功能。' }
    ]
    isMobileChatOpen.value = true
    scrollToBottom()
}

const handleGlobalSearch = async () => {
    // Legacy method - kept if we want to trigger external search on Enter
    // But now we filter locally first.
    // If we want to add new friends via search, we use the Add Friend dialog.
    if (currentTab.value === 'contacts' && friendList.value.filter(f => (f.nickname && f.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())) || (f.username && f.username.toLowerCase().includes(searchQuery.value.toLowerCase()))).length === 0) {
        // Maybe open add friend dialog with this query?
        // addFriendInput.value = searchQuery.value
        // showAddFriend.value = true
        // handleAddFriend()
    }
}

const loadMessages = async () => {
    try {
        let res
        if (currentChatGroup.value) {
            res = await getMessages(null, currentChatGroup.value.id)
        } else if (currentChatUser.value) {
            res = await getMessages(currentChatUser.value.id, null)
        } else {
            return
        }
        
        // Helper to infer type for legacy messages
        const inferType = (m) => {
            if (m.type && m.type !== 'text') return m.type
            if (m.content.startsWith('[文件]')) return 'file'
            if (m.content.match(/\.(mp4|webm|ogg)$/i) || m.content.includes('/uploads/') && m.content.endsWith('.mp4')) return 'video'
            if (m.content.match(/\.(mp3|wav|ogg)$/i)) return 'audio'
            return 'text'
        }

        // Transform messages
        messages.value = res.data.map(m => ({
            id: m.id,
            type: m.sender.id === userStore.user.id ? 'sent' : 'received',
            content: m.type === 'recall' ? '撤回了一条消息' : m.content,
            image: m.type === 'image' ? m.content : null,
            // Use inferred type for rendering logic (file, video, etc.) stored in msg.type property for v-if
            // Note: msg.type used in template is 'sent'/'received'. We need a separate property for content type.
            // Wait, template uses: :class="msg.type" (sent/received) AND v-if="msg.type === 'video'" (content type).
            // This is a conflict in the existing code! 
            // The existing code: 
            // <div ... class="message-row" :class="msg.type"> (sent/received)
            // <div v-else-if="msg.type === 'video'" ...>
            // This is definitely a bug I introduced or existed. 
            // 'msg.type' is overloaded. 
            // Let's fix this by using a separate property 'contentType' or similar, OR fixing the mapping.
            // In the map above: type: m.sender.id ... ? 'sent' : 'received' OVERWRITES the DB type!
            
            // Fix: Store direction in 'direction' or keep 'type' as direction and use 'contentType' for content.
            // BUT the template expects 'msg.type' to be sent/received for styling.
            // AND 'msg.type' to be 'video' for content. This is impossible.
            
            // Let's check template again:
            // <div ... :class="msg.type"> -> uses 'sent'/'received'
            // <div v-if="msg.image">
            // <div v-else-if="msg.type === 'video'"> -> This checks 'sent'/'received' === 'video' => FALSE.
            
            // CORRECT FIX: Separate direction and content type.
            direction: m.sender.id === userStore.user.id ? 'sent' : 'received',
            contentType: inferType(m), // Use this for content rendering
            
            sender: m.sender,
            createTime: m.createTime,
            isRecall: m.type === 'recall',
            replyToMessage: m.replyToMessage
        }))
        scrollToBottom()
    } catch (e) {
        console.error('Load messages failed', e)
    }
}

const handleRecall = async (msg) => {
    try {
        await recallMessage(msg.id)
        // Optimistic update
        msg.type = 'recall'
        msg.content = '撤回了一条消息'
        msg.isRecall = true
    } catch (e) {
        ElMessage.error(e.response?.data || '撤回失败')
    }
}

const replyMessageTarget = ref(null)
const handleReplyMessage = (msg) => {
    replyMessageTarget.value = msg
    // inputMessage.value = `回复 ${msg.sender.nickname}: ` // Optional visual cue
}

const handleDeleteMessageLocal = (index) => {
    messages.value.splice(index, 1)
}

// 显示用户信息
const showUserProfile = (user) => {
    console.log('Showing user profile:', user)
    profileUser.value = user
    profileUserVisible.value = true
}

// 格式化手机号：前 3 位 + **** + 后 2 位
const formatPhone = (phone) => {
    if (!phone || phone === '') return '未设置'
    const phoneStr = String(phone)
    if (phoneStr.length === 11) {
        return phoneStr.replace(/(\d{3})\d{6}(\d{2})/, '$1****$2')
    }
    return phoneStr // 非 11 位直接显示
}

const formatTime = (timeStr) => {
    if (!timeStr) return ''
    // 兼容 iOS/Safari: 将 "yyyy-MM-dd HH:mm:ss" 转换为 "yyyy/MM/dd HH:mm:ss" 或标准 ISO
    let safeTimeStr = timeStr
    if (typeof timeStr === 'string') {
        if (timeStr.includes('-') && !timeStr.includes('T')) {
             safeTimeStr = timeStr.replace(/-/g, '/')
        }
    }
    const date = new Date(safeTimeStr)
    if (isNaN(date.getTime())) return timeStr // Fallback if parsing fails
    
    const now = new Date()
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    
    // Format: YYYY/MM/DD HH:mm (as requested)
    // Or if today, just HH:mm? User asked "Date before time like 2026/03/05"
    // Let's force full date + time as requested: 2026/03/05 12:30
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}/${month}/${day} ${hour}:${minute}`
}

const handleSend = async () => {
  const content = inputMessage.value.trim()
  if (!content) return
  
  // Clear input immediately
  inputMessage.value = ''
  canSend.value = false
  const CHARS_PER_LINE = 50
  const willWrap = content.length > CHARS_PER_LINE

  // Optimistic update
  const tempId = 'temp-' + Date.now()
  const tempMsg = {
    id: tempId, // Add temp ID
    direction: 'sent', // Changed from type
    contentType: 'text', // Added
    content: content,
    sender: userStore.user,
    createTime: new Date().toISOString(),
    willWrap: willWrap // Flag to indicate if line-height should be 1.2
  }
  
  messages.value.push(tempMsg)
  
  const tempContent = content // Use the captured content
  // inputMessage.value = '' // Already cleared
  scrollToBottom()
  
  // Adjust line height for the new message immediately
  nextTick(() => {
    if (messageBubbles.value) {
      const bubbles = Array.isArray(messageBubbles.value) ? messageBubbles.value : [messageBubbles.value]
      const lastBubble = bubbles[bubbles.length - 1]
      if (lastBubble && !lastBubble.classList.contains('markdown-body') && !lastBubble.classList.contains('ai-bubble')) {
        lastBubble.style.lineHeight = willWrap ? '1.2' : '0.8'
      }
    }
  })
  
  try {
      let res
      if (currentChatGroup.value) {
          res = await sendMessage({ groupId: currentChatGroup.value.id, content: tempContent, type: 'text', replyToMessageId: replyMessageTarget.value?.id })
      } else if (currentChatUser.value) {
          res = await sendMessage({ receiverId: currentChatUser.value.id, content: tempContent, type: 'text', replyToMessageId: replyMessageTarget.value?.id })
      } else {
          // Official chat - AI Chat
          // Send to AI service
          // We don't wait for response here as it will come via WebSocket stream
          await sendAiMessage(tempContent)
          replyMessageTarget.value = null
          return
      }

      if (res && res.data) {
          // Find the temp message again (it might have moved if other messages arrived, though unlikely in JS single thread)
          const targetMsg = messages.value.find(m => m.id === tempId)
          if (targetMsg) {
               Object.assign(targetMsg, {
                  id: res.data.id,
                  createTime: res.data.createTime,
                  sender: res.data.sender
              })
          }
      }

      replyMessageTarget.value = null // Clear reply target
      
      // Adjust line height for the new message
      adjustBubbleLineHeight()
  } catch (e) {
      ElMessage.error(e.response?.data || '发送失败')
      // Mark temp message as failed?
      const targetMsg = messages.value.find(m => m.id === tempId)
      if (targetMsg) {
          messages.value = messages.value.filter(m => m.id !== tempId) // Remove it
      }
  }
}

// Group Logic
const handleCreateGroup = async () => {
    if (selectedFriendsForGroup.value.length < 2) { // Owner + 2 = 3
        ElMessage.warning('请至少选择2位好友')
        return
    }
    if (!groupName.value.trim()) {
        ElMessage.warning('请输入群名称')
        return
    }
    
    try {
        await createGroup(groupName.value, selectedFriendsForGroup.value)
        ElMessage.success('群聊创建成功')
        showCreateGroup.value = false
        selectedFriendsForGroup.value = []
        groupName.value = ''
        fetchData() // Reload groups
    } catch (e) {
        ElMessage.error(e.response?.data || '创建失败')
    }
}

const startGroupChat = (group) => {
    currentChatUser.value = null
    currentChatGroup.value = group
    
    // Clear unread for this group
    if (unreadCounts.byGroup[group.id] > 0) {
        unreadCounts.chat = Math.max(0, unreadCounts.chat - unreadCounts.byGroup[group.id])
        unreadCounts.byGroup[group.id] = 0
    }

    loadMessages()
    currentTab.value = 'chat'
    isMobileChatOpen.value = true
}

const handleInviteMembers = async () => {
    if (!currentChatGroup.value) return
    if (selectedFriendsForGroup.value.length === 0) return
    
    try {
        await inviteGroupMembers(currentChatGroup.value.id, selectedFriendsForGroup.value)
        ElMessage.success('邀请成功')
        // showGroupInfo.value = false // Keep open to see result or continue editing
        selectedFriendsForGroup.value = []
        fetchData() // Refresh group members
    } catch (e) {
        ElMessage.error('邀请失败')
    }
}

const handleUpdateGroup = async () => {
    if (!currentChatGroup.value) return
    try {
        await updateGroup(currentChatGroup.value.id, editGroupForm)
        ElMessage.success('群资料已更新')
        // Update local currentChatGroup immediately for UI feedback
        currentChatGroup.value.name = editGroupForm.name
        currentChatGroup.value.description = editGroupForm.description
        currentChatGroup.value.avatar = editGroupForm.avatar
        // Also refresh group list to update sidebar avatar
        fetchData()
    } catch (e) {
        ElMessage.error('更新失败')
    }
}

const handleKickMember = async (member) => {
    try {
        await ElMessageBox.confirm(`确定要将 ${member.nickname || member.username} 移出群聊吗？`, '提示', { type: 'warning' })
        await kickMember(currentChatGroup.value.id, member.id)
        ElMessage.success('已移出群聊')
        currentChatGroup.value.members = currentChatGroup.value.members.filter(m => m.id !== member.id)
        fetchData()
    } catch (e) {
        if(e !== 'cancel') ElMessage.error('操作失败')
    }
}

const handleMuteMember = async (member, minutes) => {
    const min = parseInt(minutes)
    if (min === 0) {
        try {
            await unmuteMember(currentChatGroup.value.id, member.id)
            ElMessage.success(`已解除 ${member.nickname || member.username} 的禁言`)
        } catch(e) { ElMessage.error('操作失败') }
    } else {
        try {
            await muteMember(currentChatGroup.value.id, member.id, min)
            let timeStr = min + '分钟'
            if(min === 60) timeStr = '1小时'
            if(min === 1440) timeStr = '1天'
            ElMessage.success(`已禁言 ${member.nickname || member.username} ${timeStr}`)
        } catch(e) { ElMessage.error('操作失败') }
    }
}

const triggerGroupAvatarUpload = () => {
    groupAvatarInput.value.click()
}

const handleGroupAvatarChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Check file size (头像限制为 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
        ElMessage.error('图片太大，换个图片吧~')
        event.target.value = ''
        return
    }
    
    const formData = new FormData()
    formData.append('file', file)
    try {
        const { data } = await uploadFile(formData)
        const newAvatarUrl = data.url || data
        console.log('Uploaded new group avatar:', newAvatarUrl)
        editGroupForm.avatar = newAvatarUrl
        if (currentChatGroup.value) {
            currentChatGroup.value.avatar = newAvatarUrl
        }
        ElMessage.success('头像上传成功，请点击保存修改')
    } catch (e) {
        console.error('Group avatar upload error:', e)
        if (e.response?.status === 413 || e.response?.status === 503) {
            ElMessage.error('图片太大，换个图片吧~')
        } else {
            ElMessage.error('头像上传失败，请稍后重试')
        }
    }
    event.target.value = ''
}

const handleDeleteGroup = async () => {
    try {
        await ElMessageBox.confirm('确定要解散该群聊吗？解散后所有成员将被移出，聊天记录可能无法恢复。', '警告', {
            confirmButtonText: '解散',
            cancelButtonText: '取消',
            type: 'error'
        })
        await deleteGroup(currentChatGroup.value.id)
        ElMessage.success('群聊已解散')
        showGroupInfo.value = false
        currentChatGroup.value = null
        currentTab.value = 'chat'
        fetchData()
    } catch (e) {
        if (e !== 'cancel') ElMessage.error('操作失败')
    }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const triggerAvatarUpload = () => {
    avatarInput.value.click()
}

const handleAvatarChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Read file for cropper
    const reader = new FileReader()
    reader.onload = (e) => {
        // Reset cropper first
        if (cropper.value) {
            cropper.value.destroy()
        }
        
        // Set new image and show cropper
        cropperImg.value = e.target.result
        showCropper.value = true
        
        // Reset input value so same file can be selected again
        event.target.value = ''
    }
    reader.readAsDataURL(file)
}

const handleCropUpload = () => {
    if (!cropper.value) return
    
    cropper.value.getCroppedCanvas().toBlob(async (blob) => {
        // Check file size (头像限制为 5MB)
        const maxSize = 5 * 1024 * 1024
        if (blob.size > maxSize) {
            ElMessage.error('图片太大，换个图片吧~')
            return
        }
        
        const formData = new FormData()
        formData.append('file', blob, 'avatar.png')
        
        try {
            const { data } = await uploadFile(formData)
            editForm.avatar = data.url
            showCropper.value = false
            ElMessage.success('头像已裁剪并上传，请点击保存')
        } catch (error) {
            if (error.response?.status === 413 || error.response?.status === 503) {
                ElMessage.error('图片太大，换个图片吧~')
            } else {
                ElMessage.error('头像上传失败，请稍后重试')
            }
        }
    })
}

const getFileUrl = (content) => {
    // Format: [文件] name (url)
    // The URL is always in the LAST pair of parentheses
    // Strategy: Find the last ')' then find the '(' that starts the URL part
    // The URL part always starts with '/' or 'http'
    
    const lastCloseParen = content.lastIndexOf(')')
    if (lastCloseParen === -1) return '#'
    
    // Search backwards from the last ')' to find '(' that precedes a URL
    for (let i = lastCloseParen - 1; i >= 0; i--) {
        if (content[i] === '(') {
            const potentialUrl = content.substring(i + 1, lastCloseParen)
            if (potentialUrl.startsWith('/') || potentialUrl.startsWith('http')) {
                return getImageUrl(potentialUrl)
            }
        }
    }
    
    // Fallback
    if (content.startsWith('http') || content.startsWith('/')) return getImageUrl(content)
    return '#'
}

const getFileName = (content) => {
    // Format: [文件] name (url)
    // Remove [文件] and (url)
    const name = content.replace(/^\[文件\]\s*/, '').replace(/\s*\(.*?\)$/, '')
    if (!name.trim()) return '未知文件'
    return name
}

const handleFileClick = (event, content) => {
    const url = getFileUrl(content)
    console.log('File click - Content:', content)
    console.log('File click - Extracted URL:', url)
    console.log('File click - File name:', getFileName(content))
    
    // If URL is '#', prevent default
    if (url === '#') {
        event.preventDefault()
        ElMessage.error('文件链接无效')
    }
}

const handleFileUpload = () => {
    if (isMeMuted.value) return
    fileInput.value.click()
}

const handleImageUpload = () => {
    if (isMeMuted.value) return
    imageInput.value.click()
}

const handleVideoUpload = () => {
    if (isMeMuted.value) return
    videoInput.value.click()
}

const handleVideoChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!allowedTypes.includes(file.type)) {
        ElMessage.error('不支持的视频格式，请发送 MP4、WebM 或 Ogg 格式')
        event.target.value = ''
        return
    }
    
    console.log('Uploading video:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB', 'Type:', file.type)
    
    // Optimistic Update with uploading status
    const tempId = 'temp-' + Date.now()
    const tempUrl = URL.createObjectURL(file)
    const tempMsg = {
        id: tempId,
        direction: 'sent',
        contentType: 'video',
        content: tempUrl, // Use blob URL for preview
        sender: userStore.user,
        createTime: new Date().toISOString(),
        uploading: true,
        uploadProgress: 0
    }
    messages.value.push(tempMsg)
    scrollToBottom()
    
    const formData = new FormData()
    formData.append('file', file)
    try {
        const { data } = await uploadFile(formData, {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                const targetMsg = messages.value.find(m => m.id === tempId)
                if (targetMsg) {
                    targetMsg.uploadProgress = percentCompleted
                }
            }
        })
        const videoUrl = data.url || data
        
        let res
        if (currentChatGroup.value) {
            res = await sendMessage({ groupId: currentChatGroup.value.id, content: videoUrl, type: 'video' })
        } else if (currentChatUser.value) {
            res = await sendMessage({ receiverId: currentChatUser.value.id, content: videoUrl, type: 'video' })
        }
        
        // Update optimistic message with real data
        const targetMsgIndex = messages.value.findIndex(m => m.id === tempId)
        if (targetMsgIndex > -1) {
            messages.value[targetMsgIndex] = {
                ...messages.value[targetMsgIndex],
                id: res?.data?.id || tempId,
                content: videoUrl,
                createTime: res?.data?.createTime || new Date().toISOString(),
                uploading: false,
                uploadProgress: 100
            }
        }
        ElMessage.success('视频发送成功')
    } catch (e) {
        console.error('Video upload error:', e)
        console.error('Error response:', e.response)
        console.error('Error status:', e.response?.status)
        
        let errorMsg = '视频上传失败'
        if (e.response?.status === 403) {
            errorMsg = '上传被拒绝 (403)，可能是视频格式不支持或文件太大'
        } else if (e.response?.status === 413) {
            errorMsg = '视频太大，请发送小于 50MB 的视频'
        }
        
        if (errorMsg.includes('50MB')) {
            // 移除视频大小限制的错误信息
        } else {
            ElMessage.error(errorMsg)
        }
    }
    event.target.value = ''
}

const startRecording = async () => {
    console.log('Checking media support:', {
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
        hasWebkitGetUserMedia: !!navigator.webkitGetUserMedia,
        hasMozGetUserMedia: !!navigator.mozGetUserMedia,
        hasMsGetUserMedia: !!navigator.msGetUserMedia,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent
    })
    
    // Try different getUserMedia implementations
    let getUserMediaFunc = null
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        getUserMediaFunc = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    } else if (navigator.webkitGetUserMedia) {
        getUserMediaFunc = navigator.webkitGetUserMedia.bind(navigator)
    } else if (navigator.mozGetUserMedia) {
        getUserMediaFunc = navigator.mozGetUserMedia.bind(navigator)
    } else if (navigator.msGetUserMedia) {
        getUserMediaFunc = navigator.msGetUserMedia.bind(navigator)
    }
    
    if (!getUserMediaFunc) {
        ElMessageBox.alert(
            '您的浏览器不支持录音功能，请使用现代浏览器（Chrome、Edge、Firefox 等）',
            '不支持录音',
            { confirmButtonText: '知道了', type: 'error' }
        )
        showVoiceRecorder.value = false
        return
    }

    // In non-HTTPS environment, warn user but still try
    if (window.location.protocol !== 'https:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' &&
        !window.location.hostname.startsWith('192.168.')) {
        
        try {
            await ElMessageBox.confirm(
                '您的连接不是 HTTPS，浏览器可能会限制麦克风访问。<br>是否仍要尝试？',
                '非安全连接',
                { 
                    confirmButtonText: '尝试', 
                    cancelButtonText: '取消', 
                    type: 'warning',
                    dangerouslyUseHTMLString: true
                }
            )
        } catch (e) {
            showVoiceRecorder.value = false
            return
        }
    }

    try {
        const stream = await getUserMediaFunc({ audio: true })
        mediaRecorder = new MediaRecorder(stream)
        audioChunks = []
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data)
        }
        mediaRecorder.onstop = () => {
            recordedBlob.value = new Blob(audioChunks, { type: 'audio/webm' })
            stream.getTracks().forEach(track => track.stop())
        }
        mediaRecorder.start()
        isRecording.value = true
    } catch (e) {
        console.error(e)
        ElMessage.error('无法访问麦克风: ' + (e.message || '权限被拒绝或环境不支持'))
    }
}

const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
        isRecording.value = false
    }
}

const cancelRecording = () => {
    stopRecording()
    recordedBlob.value = null
    showVoiceRecorder.value = false
}

const sendVoice = async () => {
    if (!recordedBlob.value) return
    console.log('Uploading voice message, size:', (recordedBlob.value.size / 1024 / 1024).toFixed(2), 'MB')
    
    const formData = new FormData()
    formData.append('file', recordedBlob.value, 'voice.webm')
    try {
        const { data } = await uploadFile(formData)
        const audioUrl = data.url || data
        if (currentChatGroup.value) {
            await sendMessage({ groupId: currentChatGroup.value.id, content: audioUrl, type: 'audio' })
        } else if (currentChatUser.value) {
            await sendMessage({ receiverId: currentChatUser.value.id, content: audioUrl, type: 'audio' })
        }
        ElMessage.success('语音发送成功')
        showVoiceRecorder.value = false
        recordedBlob.value = null
    } catch (e) {
        console.error('Voice upload error:', e)
        console.error('Error response:', e.response)
        console.error('Error status:', e.response?.status)
        
        let errorMsg = '语音发送失败'
        if (e.response?.status === 403) {
            errorMsg = '语音上传被拒绝 (403)'
        }
        
        ElMessage.error(errorMsg)
    }
}

const handleVoiceClick = () => {
    if (isMeMuted.value) return
    showVoiceRecorder.value = true
}

const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    console.log('Uploading file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB', 'Type:', file.type)
    
    // Optimistic Update with uploading status
    const tempId = 'temp-' + Date.now()
    const tempUrl = URL.createObjectURL(file)
    const tempMsg = {
        id: tempId,
        direction: 'sent',
        contentType: 'file',
        content: `[文件] ${file.name} (上传中...)`, // Temporary content
        sender: userStore.user,
        createTime: new Date().toISOString(),
        uploading: true, // Mark as uploading
        uploadProgress: 0 // Upload progress percentage
    }
    messages.value.push(tempMsg)
    scrollToBottom()

    const formData = new FormData()
    formData.append('file', file)
    
    try {
        // Upload with progress tracking
        const { data } = await uploadFile(formData, {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                const targetMsg = messages.value.find(m => m.id === tempId)
                if (targetMsg) {
                    targetMsg.uploadProgress = percentCompleted
                }
            }
        })
        
        const fileUrl = data.url || data
        const content = `[文件] ${file.name} (${fileUrl})`
        
        let res
        if (currentChatGroup.value) {
            res = await sendMessage({ groupId: currentChatGroup.value.id, content, type: 'file' })
        } else if (currentChatUser.value) {
            res = await sendMessage({ receiverId: currentChatUser.value.id, content, type: 'file' })
        }
        
        // Update optimistic message with real data
        const targetMsgIndex = messages.value.findIndex(m => m.id === tempId)
        if (targetMsgIndex > -1 && res && res.data) {
            messages.value[targetMsgIndex] = {
                ...messages.value[targetMsgIndex],
                id: res.data.id,
                content: res.data.content,
                createTime: res.data.createTime,
                uploading: false,
                uploadProgress: 100
            }
        }
        ElMessage.success('文件发送成功')
    } catch (e) {
        console.error('File upload error:', e)
        console.error('Error response:', e.response)
        console.error('Error status:', e.response?.status)
        
        let errorMsg = '文件上传失败'
        if (e.response?.status === 403) {
            errorMsg = '上传被拒绝 (403)，可能是文件类型不支持'
        } else if (e.response?.status === 413) {
            errorMsg = '文件太大，服务器拒绝接收'
        }
        
        ElMessage.error(errorMsg)
        // Remove temp message
        messages.value = messages.value.filter(m => m.id !== tempId)
    }
    event.target.value = ''
}

const handleImageChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    if (!allowedTypes.includes(file.type)) {
        ElMessage.error('不支持的图片格式，请发送 JPG、PNG、GIF、WebP 或 BMP 格式')
        event.target.value = ''
        return
    }
    
    console.log('Uploading image:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB', 'Type:', file.type)
    
    // Optimistic Update: Show image immediately with uploading status
    const tempId = 'temp-' + Date.now()
    const tempUrl = URL.createObjectURL(file)
    
    const tempMsg = {
        id: tempId,
        direction: 'sent',
        contentType: 'image',
        image: tempUrl, // Use blob URL for preview
        content: tempUrl,
        sender: userStore.user,
        createTime: new Date().toISOString(),
        uploading: true,
        uploadProgress: 0
    }
    messages.value.push(tempMsg)
    scrollToBottom()

    const formData = new FormData()
    formData.append('file', file)
    
    try {
        const { data } = await uploadFile(formData, {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                const targetMsg = messages.value.find(m => m.id === tempId)
                if (targetMsg) {
                    targetMsg.uploadProgress = percentCompleted
                }
            }
        })
        const imageUrl = data.url || data 
        
        let res
        if (currentChatGroup.value) {
            res = await sendMessage({ groupId: currentChatGroup.value.id, content: imageUrl, type: 'image' })
        } else if (currentChatUser.value) {
            res = await sendMessage({ receiverId: currentChatUser.value.id, content: imageUrl, type: 'image' })
        }
        
        // Update optimistic message with real server URL
        const targetMsg = messages.value.find(m => m.id === tempId)
        if (targetMsg && res && res.data) {
            // Use Object.assign with a new object to ensure reactivity
            const index = messages.value.indexOf(targetMsg)
            if (index > -1) {
                messages.value[index] = {
                    ...targetMsg,
                    id: res.data.id,
                    content: res.data.content,
                    image: res.data.content,
                    createTime: res.data.createTime,
                    contentType: 'image',
                    uploading: false,
                    uploadProgress: 100
                }
            }
        }
        ElMessage.success('图片发送成功')
    } catch (e) {
        console.error('Image upload error:', e)
        console.error('Error response:', e.response)
        console.error('Error status:', e.response?.status)
        console.error('Error data:', e.response?.data)
        
        let errorMsg = '图片上传失败'
        if (e.response?.status === 403) {
            errorMsg = '上传被拒绝 (403)，可能是图片格式不支持'
        } else if (e.response?.status === 413) {
            errorMsg = '图片太大，服务器拒绝接收'
        } else if (e.response?.status === 415) {
            errorMsg = '不支持的图片格式'
        }
        
        ElMessage.error(errorMsg)
        messages.value = messages.value.filter(m => m.id !== tempId)
    }
    event.target.value = ''
}

const handleSaveProfile = async () => {
    saving.value = true
    try {
        const { data } = await updateUser(userStore.user.id, editForm)
        // Check if data contains token (LoginResponse) or just User
        // UpdateUser returns User entity directly usually
        if (data.user) {
             userStore.updateUser(data.user)
        } else {
             userStore.updateUser(data)
        }
        ElMessage.success('个人资料已更新')
        showProfile.value = false
        
        // 刷新朋友圈列表，更新头像
        if (currentTab.value === 'moments') {
            try {
                const { data } = await getMoments()
                momentsList.value = data
            } catch (e) {
                console.error('Failed to refresh moments', e)
            }
        }
    } catch (error) {
        ElMessage.error('更新失败: ' + (error.response?.data || error.message))
    } finally {
        saving.value = false
    }
}

const emojiList = ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠', '🤡', '🥳', '🥴', '🥺', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']

import { Keyboard } from '@capacitor/keyboard'
import { Capacitor } from '@capacitor/core'

const insertEmoji = (emoji) => {
    inputMessage.value += emoji
}

const handleInput = (e) => {
    const val = e.target.value
    inputMessage.value = val
    canSend.value = val.trim().length > 0
}

const wsConnected = ref(false)

const handleInputFocus = async (e) => {
    // Wait for keyboard to pop up
    setTimeout(() => {
        // e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Also try scrolling window to bottom if on mobile
        if (window.innerWidth <= 768) {
            // Scroll more aggressively to push input up
             window.scrollTo({ top: document.body.scrollHeight + 300, behavior: 'smooth' })
        }
    }, 300)
}

onMounted(() => {
    if (Capacitor.isNativePlatform()) {
        // Handle Keyboard Events for Mobile Native
        Keyboard.addListener('keyboardWillShow', info => {
            console.log('keyboard will show with height:', info.keyboardHeight)
            // Push content up by keyboard height to make room
            const inputSection = document.querySelector('.input-section')
            if (inputSection) {
                inputSection.style.marginBottom = `${info.keyboardHeight}px`
            }
            
            // Scroll to bottom of messages
            setTimeout(() => {
                 if (messagesContainer.value) {
                     messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
                 }
                 window.scrollTo(0, document.body.scrollHeight)
            }, 100)
        })

        Keyboard.addListener('keyboardDidShow', info => {
            console.log('keyboard did show')
            // Ensure input is visible
            const input = document.querySelector('.message-input')
            if (input) {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        })

        Keyboard.addListener('keyboardWillHide', () => {
             const inputSection = document.querySelector('.input-section')
             if (inputSection) {
                 inputSection.style.marginBottom = '0px'
             }
        })
    }
})

const handleUpdateSettings = async () => {
    try {
        await updateSettings(userStore.user.id, { searchable: searchable.value })
        // Update local user store
        const updatedUser = { ...userStore.user, searchable: searchable.value }
        userStore.login(updatedUser)
        ElMessage.success('设置已更新')
    } catch (e) {
        ElMessage.error('设置更新失败')
        searchable.value = !searchable.value // revert
    }
}

// Data Fetching
const fetchData = async () => {
    try {
        const [reqs, friends, moments, groups, groupReqs] = await Promise.all([
            getFriendRequests(),
            getFriends(),
            getMoments(),
            getMyGroups(),
            getGroupRequests()
        ])
        friendRequests.value = reqs.data
        
        // Sort friends by name (Pinyin)
        friendList.value = friends.data.sort((a, b) => {
            const nameA = a.nickname || a.username
            const nameB = b.nickname || b.username
            return nameA.localeCompare(nameB, 'zh-CN')
        })
        
        momentsList.value = moments.data
        groupList.value = groups.data
        groupRequests.value = groupReqs.data
    } catch (e) {
        console.error('Failed to fetch data', e)
    }
}

watch(currentTab, async (newTab) => {
    if (newTab === 'contacts' || newTab === 'moments') {
        fetchData()
    }
    
    if (userStore.user) {
        if (newTab === 'moments') {
            try {
                await markRead(userStore.user.id, 'moments')
                unreadCounts.moments = 0
            } catch (e) {}
        } else if (newTab === 'chat') {
            try {
                await markRead(userStore.user.id, 'chat')
                unreadCounts.chat = 0
            } catch (e) {}
        }
    }
})

// Watch for active chat changes to mark as read
watch([currentChatUser, currentChatGroup], async () => {
    if (userStore.user && (currentChatUser.value || currentChatGroup.value)) {
        try {
            await markRead(userStore.user.id, 'chat')
            unreadCounts.chat = 0 // Also clear local badge
        } catch (e) {}
    }
})

// Watch search input for real-time search
let searchTimeout
watch(addFriendInput, (newVal) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    if (!newVal.trim()) {
        searchResults.value = []
        return
    }
    searchTimeout = setTimeout(() => {
        handleAddFriend()
    }, 500)
})

// Friend Logic
const prepareSendRequest = (user) => {
    currentReceiver.value = user
    requestReason.value = `我是${userStore.user.nickname || userStore.user.username}`
    showRequestReason.value = true
}

const confirmSendRequest = async () => {
    if (!currentReceiver.value) return
    try {
        await apiSendFriendRequest(currentReceiver.value.id, requestReason.value)
        ElMessage.success(`已向 ${currentReceiver.value.nickname} 发送好友请求`)
        showRequestReason.value = false
        showAddFriend.value = false
    } catch (e) {
        ElMessage.error(e.response?.data || '请求发送失败')
    }
}

const handleAddFriend = async () => {
    if (!addFriendInput.value.trim()) return
    searching.value = true
    try {
        const { data } = await searchUsers(addFriendInput.value)
        searchResults.value = data
    } catch (e) {
        // Silent error for real-time search or show minimal feedback
    } finally {
        searching.value = false
    }
}

const getAvatarUrl = (url) => {
    // Check if url is valid string and not empty
    if (!url || url === '' || url === 'null' || url === 'undefined') {
        return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
    
    // Process URL to ensure it points to the correct server IP
    let finalUrl = url
    if (finalUrl.startsWith('http')) {
        if (finalUrl.includes('localhost:8080')) {
            finalUrl = finalUrl.replace('localhost:8080', '47.98.181.100:8080')
        }
        if (finalUrl.includes('127.0.0.1:8080')) {
            finalUrl = finalUrl.replace('127.0.0.1:8080', '47.98.181.100:8080')
        }
        // Add cache buster for Android to prevent caching issues
        if (Capacitor.isNativePlatform()) {
            const separator = finalUrl.includes('?') ? '&' : '?'
            finalUrl = `${finalUrl}${separator}t=${Date.now()}`
        }
        return finalUrl
    }
    
    // If it's a relative path, prepend base URL
    // api.defaults.baseURL includes '/api', so we need just the host part
    let baseURL = api.defaults.baseURL.replace('/api', '')
    if (baseURL.includes('localhost:8080')) {
        baseURL = baseURL.replace('localhost:8080', '47.98.181.100:8080')
    } else if (baseURL.includes('127.0.0.1:8080')) {
        baseURL = baseURL.replace('127.0.0.1:8080', '47.98.181.100:8080')
    }
    
    // Ensure url starts with / if not
    const cleanUrl = url.startsWith('/') ? url : '/' + url
    let result = `${baseURL}${cleanUrl}`
    
    // Add cache buster for Android to prevent caching issues
    if (Capacitor.isNativePlatform()) {
        result += `?t=${Date.now()}`
    }
    
    return result
}

const getImageUrl = (url) => {
    if (!url) return ''
    // Handle blob URLs (for optimistic updates)
    if (url.startsWith('blob:')) return url
    
    let finalUrl = url
    if (finalUrl.startsWith('http')) {
        // Replace localhost with actual IP if found (for mobile compatibility)
        if (finalUrl.includes('localhost:8080')) {
            finalUrl = finalUrl.replace('localhost:8080', '47.98.181.100:8080')
        }
        if (finalUrl.includes('127.0.0.1:8080')) {
            finalUrl = finalUrl.replace('127.0.0.1:8080', '47.98.181.100:8080')
        }
        // Add cache buster for Android to prevent caching issues
        if (Capacitor.isNativePlatform()) {
            const separator = finalUrl.includes('?') ? '&' : '?'
            finalUrl = `${finalUrl}${separator}t=${Date.now()}`
        }
        return finalUrl
    }
    
    // Remove /api if present in url to avoid double /api/api if base has it
    // But usually url from DB is like /uploads/xxx.
    let baseURL = api.defaults.baseURL.replace('/api', '')
    if (baseURL.includes('localhost:8080')) {
        baseURL = baseURL.replace('localhost:8080', '47.98.181.100:8080')
    } else if (baseURL.includes('127.0.0.1:8080')) {
        baseURL = baseURL.replace('127.0.0.1:8080', '47.98.181.100:8080')
    }
    
    // Ensure url starts with / if not
    let result = url.startsWith('/') ? `${baseURL}${url}` : `${baseURL}/${url}`
    
    // Add cache buster for Android to prevent caching issues
    if (Capacitor.isNativePlatform()) {
        result += `?t=${Date.now()}`
    }
    
    return result
}

const isImageUrl = (url) => {
    if (!url) return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    const lowerUrl = url.toLowerCase()
    return imageExtensions.some(ext => lowerUrl.endsWith(ext))
}

const isVideoUrl = (url) => {
    if (!url) return false
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
    const lowerUrl = url.toLowerCase()
    return videoExtensions.some(ext => lowerUrl.endsWith(ext))
}

const startChat = (friend) => {
    currentChatUser.value = friend
    currentChatGroup.value = null
    
    // Clear unread for this friend
    if (unreadCounts.bySender[friend.id] > 0) {
        unreadCounts.chat = Math.max(0, unreadCounts.chat - unreadCounts.bySender[friend.id])
        unreadCounts.bySender[friend.id] = 0
    }

    loadMessages()
    
    currentTab.value = 'chat'
    isMobileChatOpen.value = true
}


const handleAccept = async (requestId) => {
    try {
        await acceptFriendRequest(requestId)
        ElMessage.success('已添加好友')
        await fetchData() // Refresh all lists
        
        // Find the friend request to get user info 
        // Note: request might be gone after fetchData, but we can try to find it in the old list or rely on fetch
        // Actually fetchData updates friendRequests so we can't find it there.
        // But the new friend is in friendList.
    } catch (e) {
        ElMessage.error('操作失败')
    }
}

const handleReject = async (requestId) => {
    try {
        await rejectFriendRequest(requestId)
        ElMessage.success('已拒绝')
        await fetchData()
    } catch (e) {
        ElMessage.error('操作失败')
    }
}

const handleAcceptGroup = async (requestId) => {
    try {
        await acceptGroupRequest(requestId)
        ElMessage.success('已加入群聊')
        await fetchData()
    } catch (e) {
        ElMessage.error('操作失败')
    }
}

const handleRejectGroup = async (requestId) => {
    try {
        await rejectGroupRequest(requestId)
        ElMessage.success('已拒绝')
        await fetchData()
    } catch (e) {
        ElMessage.error('操作失败')
    }
}

// Moments Logic
const triggerMomentMediaUpload = () => {
    momentMediaInput.value.click()
}

const handleMomentMediaChange = async (event) => {
    const files = event.target.files
    if (!files.length) return
    
    // Upload each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isVideo = file.type.startsWith('video/')
        
        // Create local preview immediately
        const previewUrl = URL.createObjectURL(file)
        
        const mediaItem = {
            type: isVideo ? 'video' : 'image',
            url: previewUrl,
            serverUrl: '',
            uploading: true
        }
        momentForm.media.push(mediaItem)

        const formData = new FormData()
        formData.append('file', file)
        try {
            console.log(`Uploading ${isVideo ? 'video' : 'image'}:`, file.name, 'Size:', file.size, 'Type:', file.type)
            const { data } = await uploadFile(formData)
            console.log('Upload response:', data)
            mediaItem.serverUrl = typeof data === 'string' ? data : data.url
            mediaItem.uploading = false
        } catch (e) {
            console.error('Upload error:', e)
            console.error('Error response:', e.response)
            ElMessage.error(isVideo ? '视频上传失败' : '图片上传失败')
            const index = momentForm.media.indexOf(mediaItem)
            if (index > -1) momentForm.media.splice(index, 1)
        }
    }
}

const handleLike = async (moment) => {
    try {
        await likeMoment(moment.id)
        // Optimistic update
        const userId = userStore.user.id
        const index = moment.likedUserIds.indexOf(userId)
        if (index > -1) {
            moment.likedUserIds.splice(index, 1)
        } else {
            moment.likedUserIds.push(userId)
        }
    } catch (e) {
        ElMessage.error('操作失败')
    }
}

const handleComment = async (moment) => {
    const content = commentInputs[moment.id]
    if (!content || !content.trim()) return
    
    const replyTo = replyTargets[moment.id]
    
    try {
        await commentMoment(moment.id, content, replyTo ? replyTo.id : null)
        ElMessage.success('评论成功')
        commentInputs[moment.id] = ''
        replyTargets[moment.id] = null // Reset reply target
        
        // Optimistic update
        moment.comments.push({
            user: userStore.user,
            replyToUser: replyTo,
            content: content,
            createTime: new Date().toISOString()
        })
    } catch (e) {
        ElMessage.error(e.response?.data || '评论失败')
    }
}

const prepareReply = (moment, user) => {
    // if (user.id === userStore.user.id) return // Don't reply to self
    replyTargets[moment.id] = user
    if (commentInputs[moment.id] === undefined) commentInputs[moment.id] = ''
}

const handleDeleteMoment = async (moment) => {
    try {
        await ElMessageBox.confirm('确定要删除这条动态吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })
        await deleteMoment(moment.id)
        ElMessage.success('删除成功')
        momentsList.value = momentsList.value.filter(m => m.id !== moment.id)
    } catch (e) {
        if (e !== 'cancel') ElMessage.error('删除失败')
    }
}

const handlePublishMoment = async () => {
    if (!momentForm.content && momentForm.media.length === 0) return
    
    // Check if any uploads are pending
    if (momentForm.media.some(item => item.uploading)) {
        ElMessage.warning('请等待媒体文件上传完成')
        return
    }

    saving.value = true
    try {
        // Transform media to simple URL strings for the backend
        const payload = {
            content: momentForm.content,
            media: momentForm.media.map(item => item.serverUrl).filter(url => url)
        }
        console.log('Publishing moment with payload:', payload)
        await publishMoment(payload)
        ElMessage.success('发布成功')
        showMomentsPublish.value = false
        momentForm.content = ''
        momentForm.media = []
        fetchData()
    } catch (e) {
        console.error('Publish moment error:', e)
        console.error('Error response:', e.response)
        console.error('Error data:', e.response?.data)
        ElMessage.error('发布失败')
    } finally {
        saving.value = false
    }
}

const stompClient = ref(null)

const connectWebSocket = () => {
    if (!userStore.isAuthenticated) return
    
    // Explicitly use the IP address for WebSocket on Android
    let baseUrl = api.defaults.baseURL.replace('/api', '')
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        baseUrl = baseUrl.replace('localhost', '47.98.181.100').replace('127.0.0.1', '47.98.181.100')
    }
    
    // Try SockJS for better compatibility on Android if Native WebSocket fails
    const wsUrl = baseUrl + '/ws'
    
    console.log('Connecting to WebSocket (SockJS) at:', wsUrl)

    const client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: {
            Authorization: `Bearer ${userStore.token}`
        },
        debug: (str) => {
            console.log('WS Debug:', str)
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    })

    client.onConnect = (frame) => {
        wsConnected.value = true
        console.log('WS Connected')
        // Subscribe to user queue
        client.subscribe('/user/queue/messages', (message) => {
            const msg = JSON.parse(message.body)
            handleIncomingMessage(msg)
        })

        // Subscribe to friend updates (e.g. new friend added)
        client.subscribe('/user/queue/friends', (message) => {
            const msg = JSON.parse(message.body)
            console.log('Received friend update message:', msg)
            if (msg.type === 'new_friend' && msg.friend) {
                // Check if already exists to avoid duplicates
                if (!friendList.value.some(f => f.id === msg.friend.id)) {
                    friendList.value.push(msg.friend)
                    
                    // Remove from friendRequests if present (for the acceptor side)
                    const reqIndex = friendRequests.value.findIndex(r => r.sender.id === msg.friend.id)
                    if (reqIndex > -1) {
                        friendRequests.value.splice(reqIndex, 1)
                    }

                    ElMessage.success(`您已添加 ${msg.friend.nickname || msg.friend.username} 为好友`)
                }
            } else if (msg.type === 'friend_deleted' && msg.friendId) {
                // Handle deletion
                friendList.value = friendList.value.filter(f => f.id !== msg.friendId)
                
                // If currently chatting with this friend, close chat or show alert
                if (currentChatUser.value && currentChatUser.value.id === msg.friendId) {
                    ElMessage.warning('对方已将您删除好友')
                }
            } else if (msg.type === 'friend_updated' && msg.friend) {
                console.log('Processing friend_updated message:', msg.friend)
                // Handle friend info update (e.g. avatar, nickname)
                const index = friendList.value.findIndex(f => f.id === msg.friend.id)
                if (index > -1) {
                    friendList.value[index] = { ...friendList.value[index], ...msg.friend }
                    
                    // Update moments if user is in moments list
                    const momentIndex = momentsList.value.findIndex(m => m.user.id === msg.friend.id)
                    if (momentIndex > -1) {
                        console.log('Updating moment for user:', msg.friend.id)
                        momentsList.value[momentIndex].user = { ...momentsList.value[momentIndex].user, ...msg.friend }
                    }
                    
                    // If on moments tab, refresh moments to get latest avatar
                    if (currentTab.value === 'moments') {
                        console.log('On moments tab, refreshing data...')
                        fetchData()
                    }
                    
                    ElMessage.success(`${msg.friend.nickname || msg.friend.username} 的信息已更新`)
                } else {
                    console.log('Friend not found in friendList:', msg.friend.id)
                }
            } else if (msg.type === 'group_invite' && msg.request) {
                // Add to group requests list
                if (!groupRequests.value.some(r => r.id === msg.request.id)) {
                    groupRequests.value.push(msg.request)
                    if (currentTab.value === 'contacts') {
                        // Maybe show red dot
                    }
                    unreadCounts.contacts++
                    ElMessage.info('收到新的群聊邀请')
                }
            }
        })
        
        // Subscribe to group topics
        groupList.value.forEach(group => {
            client.subscribe(`/topic/group/${group.id}`, (message) => {
                const msg = JSON.parse(message.body)
                handleIncomingMessage(msg)
            })
            // Subscribe to group events (mute, update, etc)
            client.subscribe(`/topic/group/${group.id}/events`, (message) => {
                const event = JSON.parse(message.body)
                handleGroupEvent(event)
            })
        })
        
        // Subscribe to moment comments
        client.subscribe('/topic/moments', (message) => {
             // Refresh moments if a new comment/like/post occurs
             if (currentTab.value === 'moments') {
                 fetchData()
             } else {
                 // Increment unread count for moments if not on moments tab
                 unreadCounts.moments++
             }
        })
    }
    
    client.onDisconnect = () => {
        wsConnected.value = false
        console.log('WS Disconnected')
    }
    
    client.onWebSocketClose = () => {
        wsConnected.value = false
        console.log('WS Closed')
    }
    
    client.activate()
    stompClient.value = client
}

const handleGroupEvent = (event) => {
    if (!currentChatGroup.value || currentChatGroup.value.id !== event.groupId) return
    
    if (event.type === 'mute') {
        if (!currentChatGroup.value.mutedMembers) currentChatGroup.value.mutedMembers = {}
        if (event.duration > 0) {
            currentChatGroup.value.mutedMembers[event.userId] = new Date(Date.now() + event.duration * 60000).toISOString()
        } else {
             delete currentChatGroup.value.mutedMembers[event.userId]
        }
        // Force update UI
        checkMuteStatus()
    } else if (event.type === 'update') {
        // Handle group info update
         if (event.avatar) currentChatGroup.value.avatar = event.avatar
         if (event.name) currentChatGroup.value.name = event.name
         if (event.description) currentChatGroup.value.description = event.description
    } else if (event.type === 'kick') {
        // If I am kicked?
        if (event.userId === userStore.user.id) {
            ElMessage.error('你已被移出该群聊')
            currentChatGroup.value = null
            currentTab.value = 'chat'
            fetchData()
        } else {
            // Remove member from local list
            currentChatGroup.value.members = currentChatGroup.value.members.filter(m => m.id !== event.userId)
        }
    }
}

const handleIncomingMessage = async (msg) => {
    // 0. Handle Stream (AI)
    if (msg.type === 'stream') {
        const msgId = msg.id || msg.messageId
        const aiSenderId = msg.senderId || 6 // AI user ID is usually 6
        
        // Only process if we are currently chatting with AI
        // AI chat is identified by currentChatUser.id === 6 (or whatever AI ID is)
        if (!currentChatUser.value || currentChatUser.value.id !== aiSenderId) {
            return 
        }

        // Find if we already have this message
        const existingMsg = messages.value.find(m => m.id === msgId)
        if (existingMsg) {
            // Append content
            if (msg.content) {
                // If it was empty placeholder, replace content, else append
                // But only if we are appending new content, not replacing entire history
                // AI streaming usually sends chunks.
                if (!existingMsg.content) existingMsg.content = msg.content
                else existingMsg.content += msg.content
                
                // Scroll to bottom
                nextTick(() => {
                    if (messagesContainer.value) {
                         messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
                    }
                })
            }
        } else {
            // New AI message starting
            messages.value.push({
                id: msgId,
                direction: 'received',
                contentType: 'text',
                content: msg.content || '',
                sender: { id: aiSenderId, nickname: '炘灏科技', avatar: 'https://raw.githubusercontent.com/MSDOS-Signal/mybackend/refs/heads/main/uploads/ai_avatar.jpg' }, 
                createTime: new Date().toISOString(),
                isRecall: false
            })
            scrollToBottom()
        }
        return
    }

    // 1. If it's a recall message
    if (msg.type === 'recall') {
        // Update local message
        const existingMsg = messages.value.find(m => m.id === msg.id)
        if (existingMsg) {
            existingMsg.type = 'recall'
            existingMsg.content = '撤回了一条消息'
            existingMsg.isRecall = true
        }
        return
    }

    // 2. Determine if it belongs to current chat
    const isCurrentChat = 
        (currentChatUser.value && msg.sender?.id === currentChatUser.value.id && !msg.group) || // From friend
        (currentChatUser.value && msg.receiver?.id === currentChatUser.value.id && msg.sender?.id === userStore.user.id && !msg.group) || // From me (echo)
        (currentChatGroup.value && msg.group?.id === currentChatGroup.value.id) // Group chat

    // Infer content type for incoming message
    let contentType = 'text'
    if (msg.type && msg.type !== 'text') contentType = msg.type
    else if (msg.content.startsWith('[文件]')) contentType = 'file'
    else if (msg.content.match(/\.(mp4|webm|ogg)$/i) || msg.content.includes('/uploads/') && msg.content.endsWith('.mp4')) contentType = 'video'
    else if (msg.content.match(/\.(mp3|wav|ogg)$/i)) contentType = 'audio'

    if (isCurrentChat) {
        // Avoid duplicate if optimistic update already added it (check by temporary ID or content/time heuristics if needed)
        // For simplicity, we might just append if not exists, or replace optimistic one.
        // Since backend sends back full message with ID, we can replace or append.
        // Simplest: Check if last message is similar (sent by me, same content, recent) and replace it, or just push.
        
        // Filter out duplicate echo from self
        // Check if we have a temp message that matches this real message
        // Or if we have a real message with same ID already
        const existingRealMsg = messages.value.find(m => m.id === msg.id)
        if (existingRealMsg) return // Already processed via API response or duplicate WS frame
        
        // Check for optimistic message match (same content, sent by me, recent, temp ID)
        // We use reverse search to find the latest matching temp message
        let matchIndex = -1
        for (let i = messages.value.length - 1; i >= 0; i--) {
            const m = messages.value[i]
            const isTempMsg = typeof m.id === 'string' && m.id.startsWith('temp-')
            const isMyMsg = m.direction === 'sent' && msg.sender.id === userStore.user.id
            
            if (!isTempMsg || !isMyMsg) continue
            
            // For image/video/audio messages, match by contentType and recent time
            // (because temp message has blob URL, server message has real URL)
            if (contentType === 'image' || contentType === 'video' || contentType === 'audio') {
                const msgTime = new Date(m.createTime).getTime()
                const now = Date.now()
                const isRecent = (now - msgTime) < 30000 // Within 30 seconds
                const typeMatches = m.contentType === contentType || m.image || m.content?.includes('/uploads/')
                if (isRecent && typeMatches) {
                    matchIndex = i
                    break
                }
            } else if (contentType === 'file') {
                // For file messages, match by file name
                const tempFileName = getFileName(m.content)
                const realFileName = getFileName(msg.content)
                if (tempFileName === realFileName && tempFileName !== '未知文件') {
                    matchIndex = i
                    break
                }
            } else {
                // For text messages, match by exact content
                if (m.content === msg.content) {
                    matchIndex = i
                    break
                }
            }
        }
        
        if (matchIndex > -1) {
            // Update the optimistic message with real data
            Object.assign(messages.value[matchIndex], {
                id: msg.id,
                createTime: msg.createTime,
                direction: msg.sender.id === userStore.user.id ? 'sent' : 'received',
                contentType: contentType,
                content: msg.content,
                image: contentType === 'image' ? msg.content : messages.value[matchIndex].image,
                sender: msg.sender,
                replyToMessage: msg.replyToMessage
            })
        } else {
             // Not a duplicate of optimistic msg, so append it
             // BUT wait, if it's sent by me and I didn't find a temp msg, maybe I just sent it from another tab?
             // Or the temp msg was already updated by API response?
             // If API response updated it, it has a real ID now.
             // So 'existingRealMsg' check above handles that.
             
             messages.value.push({
                id: msg.id,
                direction: msg.sender.id === userStore.user.id ? 'sent' : 'received',
                contentType: contentType,
                content: msg.content,
                image: msg.type === 'image' ? msg.content : null,
                sender: msg.sender,
                createTime: msg.createTime,
                replyToMessage: msg.replyToMessage,
                isRecall: false
            })
            scrollToBottom()
        }
        
        // Mark as read immediately if it's an incoming message in current chat
        if (msg.sender.id !== userStore.user.id) {
             try {
                await markRead(userStore.user.id, 'chat')
                // Don't increment unread counts
             } catch (e) {}
        }

    } else {
        // 3. Notification (Red Dot)
        if (msg.sender?.id && msg.sender.id !== userStore.user.id) { // Only notify if not from self (e.g. sent from another device)
            if (msg.group) {
                 const groupId = msg.group.id
                 if (groupId) {
                     unreadCounts.byGroup[groupId] = (unreadCounts.byGroup[groupId] || 0) + 1
                 }
            } else {
                const senderId = msg.sender.id
                if (senderId) {
                    unreadCounts.bySender[senderId] = (unreadCounts.bySender[senderId] || 0) + 1
                }
            }
            unreadCounts.chat++
            ElMessage.info(`收到新消息: ${msg.sender.nickname || '未知用户'}`)
        }
    }
}

// ... existing polling code ...
// We can keep polling as fallback or remove it.
// Let's keep polling for friend requests, but remove message polling if WebSocket is active.

// Modified startPolling
const startPolling = () => {
    pollInterval = setInterval(async () => {
        if (!userStore.user) return

        try {
            const { data } = await getUnreadCounts(userStore.user.id)
            unreadCounts.chat = data.chat
            unreadCounts.contacts = data.contacts
            unreadCounts.moments = data.moments
            unreadCounts.bySender = data.chatBySender || {}
            unreadCounts.byGroup = data.chatByGroup || {}
            
            // Refresh friend requests list if on contacts tab
            if (currentTab.value === 'contacts') {
                 const reqs = await getFriendRequests()
                 friendRequests.value = reqs.data
            }
        } catch (e) {}
        
    }, 5000) 
}

const contextMenuVisible = ref(null)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuEvent = ref(null)
const menuStyle = ref({ top: '0px', left: '0px' })

const showContextMenu = (event, index) => {
    // Prevent default browser context menu
    if (event.preventDefault) event.preventDefault()
    if (event.stopPropagation) event.stopPropagation()
    
    // Handle both mouse and touch events
    let clientX, clientY
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX
        clientY = event.touches[0].clientY
    } else {
        clientX = event.clientX
        clientY = event.clientY
    }
    
    // Set position directly based on coordinates
    menuStyle.value = {
        top: (clientY + 10) + 'px',
        left: (clientX + 10) + 'px'
    }
    
    // Show menu
    contextMenuVisible.value = index
    
    chatContextMenuVisible.value = false
    contactContextMenuVisible.value = false
}

const handleCopyMessage = async (msg) => {
    try {
        await navigator.clipboard.writeText(msg.content)
        ElMessage.success('已复制')
    } catch (e) {
        ElMessage.error('复制失败')
    }
    contextMenuVisible.value = null
}

const closeContextMenu = () => {
    contextMenuVisible.value = null
}

onMounted(() => {
  document.addEventListener('click', closeContextMenu)
  scrollToBottom()
  fetchData().then(() => {
      connectWebSocket()
      if (userStore.user) {
          getUnreadCounts(userStore.user.id).then(res => {
              if (res.data) {
                  unreadCounts.chat = res.data.chat
                  unreadCounts.contacts = res.data.contacts
                  unreadCounts.moments = res.data.moments
                  unreadCounts.bySender = res.data.chatBySender || {}
                  unreadCounts.byGroup = res.data.chatByGroup || {}
              }
          })
      }
  })
  startPolling()
})

// Adjust line height dynamically based on content width
const adjustBubbleLineHeight = () => {
  nextTick(() => {
    if (messageBubbles.value) {
      const bubbles = Array.isArray(messageBubbles.value) ? messageBubbles.value : [messageBubbles.value]
      bubbles.forEach((bubble, index) => {
        if (bubble && !bubble.classList.contains('markdown-body') && !bubble.classList.contains('ai-bubble')) {
          // Get the corresponding message
          const msg = messages.value[index]
          if (msg) {
            // Calculate if content will wrap (assuming ~50 characters per line at 400px width)
            const CHARS_PER_LINE = 50
            const willWrap = msg.content.length > CHARS_PER_LINE
            
            bubble.style.lineHeight = willWrap ? '1.2' : '0.8'
          }
        }
      })
    }
  })
}

onUpdated(() => {
  adjustBubbleLineHeight()
})

onUnmounted(() => {
    document.removeEventListener('click', closeContextMenu)
    if (pollInterval) clearInterval(pollInterval)
    if (stompClient.value) stompClient.value.deactivate()
})
</script>

<style scoped>
/* Existing styles... */
/* Recall Message Centering */
.recall-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 100%; /* Override max-width: 70% */
}

.recall-tip {
    font-size: 12px;
    color: var(--text-secondary);
    background-color: var(--bg-hover);
    padding: 4px 8px;
    border-radius: 4px;
    text-align: center;
    margin: 5px 0;
    width: auto;
}

.reply-context {
    font-size: 12px;
    color: var(--text-secondary);
    background-color: rgba(0,0,0,0.05);
    padding: 4px;
    border-radius: 4px;
    margin-bottom: 4px;
    border-left: 2px solid var(--accent-color);
}

.msg-time {
    font-size: 10px;
    color: var(--text-secondary);
    float: right;
    margin-top: 4px;
    margin-left: 8px;
}

.reply-target-bar {
    background-color: var(--bg-hover);
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    border-bottom: 1px solid var(--border-color);
}

.msg-actions {
    display: flex;
    flex-direction: column;
}

.action-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
}

.action-item:hover {
    background-color: var(--bg-hover);
}

/* Consolidated .bubble styles are below */

/* ... */
.icon-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.badge {
    position: absolute;
    top: -5px;
    right: -8px;
    background-color: #ff4d4f;
    color: white;
    font-size: 10px;
    height: 16px;
    min-width: 16px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 4px;
}
/* ... */
.cropper-container {
        width: 100%;
        height: 400px;
        background-color: #f0f0f0;
        overflow: hidden; /* Ensure image doesn't overflow */
    }

    /* Constrain image in cropper */
    :deep(.cropper-container img) {
        max-width: 100%;
    }
/* Context Menu */
.msg-context-menu {
    position: fixed; /* Use fixed to position relative to viewport */
    background: var(--bg-card); /* Should be solid color from theme */
    background-color: var(--bg-secondary); /* Ensure solid background */
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 5px 0;
    z-index: 2000; /* Higher layer to avoid being blocked by bubbles */
    min-width: 80px;
}

/* Ensure action trigger area doesn't block clicks on media controls */
.action-trigger-area {
    display: none;
}

.clickable {
    transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.2s;
    cursor: pointer;
}
.clickable:active {
    transform: scale(0.96);
    opacity: 0.8;
}

/* Animations */
.list-item, .moment-card, .nav-item {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.list-item:active, .nav-item:active {
    transform: scale(0.98);
}

/* Fix Context Menu Z-index and visibility */
.message-row {
    position: relative; /* Context for menu positioning */
    z-index: 1; /* Allow menu to be above siblings */
    overflow: visible; /* Ensure menu doesn't get clipped */
    animation: slideIn 0.3s cubic-bezier(0.2, 0, 0.2, 1);
    will-change: transform, opacity;
}

.message-row.sent {
    z-index: 2; /* Ensure sent messages can overlap received? No, let's keep them same but higher when menu is open */
}

.message-row:has(.msg-context-menu) {
    z-index: 999; /* Temporarily lift row when menu is open */
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Desktop tab transition (fade) */
.tab-fade-desktop-enter-active,
.tab-fade-desktop-leave-active {
    transition: opacity 0.2s ease;
}

.tab-fade-desktop-enter-from,
.tab-fade-desktop-leave-to {
    opacity: 0;
}

/* Mobile tab transition (slide from right) */
@media (max-width: 768px) {
    .tab-fade-desktop-enter-active,
    .tab-fade-desktop-leave-active {
        transition: transform 0.3s ease;
    }
    
    .tab-fade-desktop-enter-from {
        transform: translateX(100%); /* Slide in from right */
        opacity: 0;
    }
    
    .tab-fade-desktop-leave-to {
        transform: translateX(-100%); /* Slide out to left */
        opacity: 0;
    }
}

/* 1. 普通聊天气泡：单行紧凑，多行自动调整 */
.bubble:not(.markdown-body):not(.ai-bubble) {
    line-height: 0.8;
    max-width: 400px; /* Limit width to force wrapping */
    width: fit-content;
    word-break: break-word; /* Break long words if needed */
    white-space: normal; /* Allow wrapping */
    overflow-wrap: break-word; /* Ensure long text wraps */
    display: block; /* Change to block for better control */
    text-align: left; /* Align text to the left */
}

/* Sent messages: align right, extend from right to left */
.sent .bubble:not(.markdown-body):not(.ai-bubble) {
    margin-left: auto; /* Push bubble to the right */
}

/* Received messages: align left, extend from left to right */
.received .bubble:not(.markdown-body):not(.ai-bubble) {
    margin-right: auto; /* Push bubble to the left */
}

.bubble:not(.markdown-body):not(.ai-bubble) p {
    line-height: inherit !important;
    margin: 0 !important;
}

/* 2. AI 气泡：独立设置，行高 1.6 */
.bubble.markdown-body.ai-bubble {
    line-height: 1.6 !important;
    display: block;
}

.bubble.markdown-body.ai-bubble p,
.bubble.markdown-body.ai-bubble li,
.bubble.markdown-body.ai-bubble div,
.bubble.markdown-body.ai-bubble span {
    line-height: 1.6 !important;
}

/* 基础气泡样式 (不包含行高) */
.bubble {
    padding: 0.1px 10px;
    border-radius: 12px;
    font-size: 14px;
    position: relative;
    word-wrap: break-word;
    width: fit-content;
    max-width: 100%;
    box-shadow: 0 1px 2px var(--shadow-color);
    transition: all 0.2s ease;
}

.bubble p {
    margin: 0; 
}

.markdown-body code {
    background-color: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
}
.markdown-body pre {
    background-color: #282c34;
    color: #abb2bf;
    padding: 10px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
    line-height: 1.4 !important;
}
.markdown-body pre code {
    background-color: transparent;
    padding: 0;
    color: inherit;
}
.markdown-body ul, .markdown-body ol {
    margin: 8px 0;
    padding-left: 20px;
    line-height: 1.6 !important;
}
.markdown-body blockquote {
    margin: 8px 0;
    padding-left: 10px;
    border-left: 3px solid var(--accent-color);
    color: var(--text-secondary);
}
.markdown-body a {
    color: var(--accent-color);
    text-decoration: none;
}
.markdown-body a:hover {
    text-decoration: underline;
}

.sent .markdown-body code {
    background-color: rgba(255, 255, 255, 0.2);
}

.sent .markdown-body a {
    color: #ffffff;
    text-decoration: underline;
}

/* Adjust bubble color for code blocks visibility */
.received .bubble {
  background-color: var(--bubble-received);
  color: var(--bubble-text-received);
  border-bottom-left-radius: 4px;
}

.sent .bubble {
  background-color: var(--bubble-sent);
  color: var(--bubble-text-sent);
  border-bottom-right-radius: 4px;
}

/* Ensure images/videos inside bubbles still have size */
.bubble img, .bubble video {
    line-height: normal;
}

.sent .bubble {
    border-bottom-right-radius: 4px; /* Distinctive tail */
    background: linear-gradient(135deg, var(--bubble-sent), var(--accent-hover));
}

.received .bubble {
    border-bottom-left-radius: 4px;
    background-color: var(--bubble-received);
    border: 1px solid var(--border-color);
}

/* Tighten container gap */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px; /* Slightly reduced padding */
  display: flex;
  flex-direction: column;
  gap: 12px; /* Reduced gap for better flow */
}

/* Fix Bubble Alignment */
.message-content {
    flex: 0 1 auto; /* Don't expand to fill container */
    width: fit-content; /* Fit to content */
    max-width: 75%; /* Limit max width for readability */
    display: flex;
    flex-direction: column;
    position: relative;
}

.sent .message-content {
    align-items: flex-end; /* Force children to align right */
}

.received .message-content {
    align-items: flex-start; /* Force children to align left */
}

.sent .bubble {
    /* Remove margin-left: auto to keep bubble closer to avatar */
}

.received .bubble {
    margin-right: auto; /* Push bubble to the far left of its container */
}

/* Adjust timestamp spacing */
.msg-footer {
    display: flex;
    margin-top: 0; /* Remove gap */
    opacity: 0.6;
    font-size: 10px;
    font-weight: 500;
}

.msg-footer .msg-time {
    color: var(--text-primary);
    font-weight: bold;
    font-family: "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

html.dark .msg-footer .msg-time {
    color: #ffffff;
}

html:not(.dark) .msg-footer .msg-time {
    color: #000000;
}

.received .msg-footer {
    justify-content: flex-start; 
    padding-left: 5px;
}

.sent .msg-footer {
    justify-content: flex-end; 
    padding-right: 5px;
}

/* Specific component colors */
.moment-user .nickname {
    color: var(--moments-accent) !important;
}

.action-btn.active {
    color: var(--moments-accent) !important;
}

.send-btn {
    background-color: var(--accent-color) !important;
}

/* Input area refinement */
.search-wrapper:focus-within {
    border-color: var(--accent-color) !important;
    box-shadow: 0 0 0 2px var(--accent-light);
}

.message-input:focus {
    /* No focus ring needed for textarea, but let's ensure text is clear */
}

/* Mobile Bottom Nav Styles - Minimalist (No background fill) */
/* REMOVED DUPLICATES */

/* Emoji Grid */
.emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 5px;
    max-height: 200px;
    overflow-y: auto;
    padding: 5px;
}

.emoji-item {
    font-size: 20px;
    cursor: pointer;
    text-align: center;
    padding: 5px;
    border-radius: 4px;
}

.emoji-item:hover {
    background-color: var(--bg-hover);
}

/* Contacts Section */
.section-title {
    font-size: 12px;
    color: var(--text-secondary);
    padding: 10px 12px;
    font-weight: 600;
}

.request-item {
    background-color: rgba(16, 163, 127, 0.1);
}

.request-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
}

/* Moments Styles */
.moments-container {
    padding: 0;
}

.moments-header {
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    position: sticky;
    top: 0;
    background-color: var(--bg-glass);
    backdrop-filter: blur(10px);
    z-index: 5;
}

.moment-card {
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
}

.moment-header {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.moment-user {
    display: flex;
    flex-direction: column;
}

.moment-user .nickname {
    font-weight: 600;
    color: var(--accent-color);
    font-size: 14px;
}

.moment-user .time {
    font-size: 11px;
    color: var(--text-secondary);
}

.moment-content {
    font-size: 14px;
    margin-bottom: 10px;
    white-space: pre-wrap;
    line-height: 1.5;
}

.moment-media {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
}

.moment-img {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 4px;
    cursor: pointer;
}

.moment-video {
    width: 100%;
    border-radius: 4px;
    grid-column: span 3;
    max-height: 400px;
}

.moment-footer {
    margin-top: 10px;
}

.action-bar {
    display: flex;
    gap: 20px;
    padding: 5px 0;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 13px;
}

.action-btn:hover, .action-btn.active {
    color: var(--accent-color);
}

.comments-section {
    background-color: var(--bg-hover);
    padding: 8px;
    border-radius: 4px;
    margin-top: 5px;
    font-size: 13px;
}

.comment-item {
    margin-bottom: 4px;
}

.comment-user {
    color: var(--accent-color);
    font-weight: 500;
    margin-right: 5px;
}

.comment-content {
    color: var(--text-primary);
}

.comment-input-area {
    margin-top: 8px;
}

/* Moment Send Button Override */
:deep(.moment-send-btn) {
    border-radius: 0 4px 4px 0;
    height: 100%;
    margin: 0 !important;
}

:deep(.el-input-group__append) {
    padding: 0;
    border: none;
    background-color: transparent;
}

/* Upload Area in Dialog */
.upload-area {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 15px;
}

.upload-btn {
    width: 80px;
    height: 80px;
    border: 1px dashed var(--border-color);
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: var(--text-secondary);
}

.upload-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
}

.image-preview {
    width: 80px;
    height: 80px;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
}

.preview-img {
    width: 100%;
    height: 100%;
}

.preview-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-media {
    position: absolute;
    top: 0;
    right: 0;
    background: rgba(0,0,0,0.5);
    color: white;
    padding: 2px;
    cursor: pointer;
}

.chat-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: transparent; /* Changed from var(--bg-primary) to show TechBackground */
  color: var(--text-primary);
  overflow: hidden;
  transition: background-color 0.3s, color 0.3s;
  position: relative;
  z-index: 1;
}

/* Ensure sub-components have semi-transparent backgrounds to show the network */
 .sidebar, .sub-sidebar, .main-area, .chat-header, .input-section {
     background-color: var(--bg-glass);
     backdrop-filter: blur(10px);
 }
 
 /* Search Results List */
.search-results-list {
    max-height: 250px; /* Limit to show ~5 items */
    overflow-y: auto; /* Add scrollbar when content overflows */
    margin-top: 10px;
}

/* User List in Dialog */
.user-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid var(--border-color);
    gap: 12px;
}

.user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.user-info .nickname {
    font-weight: 500;
    color: var(--text-primary);
}

.user-info .username {
    font-size: 12px;
    color: var(--text-secondary);
}

/* 1. 一级侧边栏 (图标导航) */
.sidebar {
  width: 68px;
  /* background-color: var(--bg-primary); Removed for transparency */
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  flex-shrink: 0;
  z-index: 10;
}

.logo-area {
  margin-bottom: 32px;
}

.user-avatar {
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-avatar:hover {
  border-color: var(--accent-color);
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  align-items: center;
}

.nav-item {
  width: 44px;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

/* Sidebar Navigation (Desktop) - Keep background for desktop only if desired, or make minimal too */
@media (min-width: 769px) {
    .sidebar .nav-item.active {
        background-color: var(--accent-color);
        color: #ffffff;
        box-shadow: 0 4px 12px var(--shadow-color);
    }
    
    /* Ensure input footer and send button are visible on desktop */
    .input-footer {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
    
    .input-section .send-btn {
        display: inline-flex !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
}

.nav-item .el-icon {
  font-size: 22px;
}

.bottom-actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.logout:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

/* 2. 二级侧边栏 (列表) */
.sub-sidebar {
  width: 280px;
  /* background-color: var(--bg-secondary); Removed */
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.search-header {
  padding: 20px;
  /* Add padding top for mobile status bar */
  padding-top: max(20px, env(safe-area-inset-top)); 
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-wrapper {
  flex: 1;
  background-color: var(--input-bg);
  border-radius: 6px;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.search-wrapper:focus-within {
  border-color: var(--accent-color);
}

.search-icon {
  color: var(--text-secondary);
  font-size: 14px;
  margin-right: 8px;
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  width: 100%;
  font-size: 13px;
}

.add-btn {
  width: 32px;
  height: 32px;
  background-color: var(--input-bg);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.add-btn:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
  /* Fix for mobile bottom bar overlapping content */
  padding-bottom: calc(70px + env(safe-area-inset-bottom)); 
}

.list-item {
  display: flex;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.list-item:hover {
  background-color: var(--bg-tertiary);
}

.list-item.active {
  background-color: var(--bg-hover);
  background-color: var(--bg-tertiary); /* Fix for light mode visibility */
}

.list-item.pinned {
    background-color: rgba(0, 0, 0, 0.03);
}

.dark .list-item.pinned {
    background-color: rgba(255, 255, 255, 0.03);
}


.item-avatar {
  margin-right: 12px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary);
}

.item-time {
  font-size: 11px;
  color: var(--text-secondary);
}

.item-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

/* 3. 主聊天区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  /* background-color: var(--bg-primary); Removed */
  position: relative;
}

.chat-header {
  height: 64px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  /* background-color: var(--bg-primary); Removed */
}

.header-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag {
  font-size: 10px;
  background-color: rgba(16, 163, 127, 0.15);
  color: var(--accent-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  margin-left: 8px;
}

.header-actions .el-button {
  color: var(--text-secondary);
}

.header-actions .el-button:hover {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-row {
  display: flex;
  gap: 5px; /* Reduced gap */
  max-width: 80%;
  align-items: flex-start; /* Avatar at top */
}

.message-row.recall-row {
    align-self: center;
    max-width: 100%;
    justify-content: center;
    margin: 10px 0;
}

.message-row.received {
  align-self: flex-start;
}

.message-row.sent {
  align-self: flex-end;
  justify-content: flex-end; 
}

.msg-avatar {
  flex-shrink: 0;
  cursor: pointer;
}

/* REDUNDANT BUBBLE STYLE REMOVED - Using consolidated .bubble styles above */

.image-bubble {
    border-radius: 12px;
    overflow: hidden;
    max-width: 200px;
    border: 1px solid var(--border-color);
}

.msg-image {
    display: block;
    width: 100%;
    height: auto;
}

/* REMOVED DUPLICATE MARKDOWN STYLES - Handled in bubble section */
/* 4. 输入框区域 */
.input-section {
  padding: 20px 24px;
  /* background-color: var(--bg-primary); Removed */
  border-top: 1px solid var(--border-color);
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.tool-icon {
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 18px;
  transition: color 0.2s;
  display: flex;
  align-items: center;
}

.tool-icon:hover {
  color: var(--text-primary);
}

.message-input {
  width: 100%;
  height: 80px;
  background-color: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  resize: none;
  font-family: inherit;
  line-height: 1.5;
}

.message-input::placeholder {
  color: var(--text-secondary);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.send-btn {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover {
  background-color: var(--accent-hover);
}

.send-btn:disabled {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

/* Profile Dialog Styles */
.profile-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.profile-avatar {
    margin-bottom: 10px;
    border: 2px solid var(--border-color);
}

:deep(.custom-dialog) {
    background-color: var(--bg-secondary);
    border-radius: 12px;
    max-width: 90vw;
}

:deep(.custom-dialog .el-dialog__title) {
    color: var(--text-primary);
}

:deep(.custom-dialog .el-dialog__body) {
    padding-top: 10px;
}

:deep(.el-form-item__label) {
    color: var(--text-primary);
}

:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
    background-color: var(--input-bg);
    box-shadow: 0 0 0 1px var(--border-color) inset;
}

:deep(.el-input__inner), :deep(.el-textarea__inner) {
    color: var(--text-primary);
}

/* Profile View Dialog */
:deep(.profile-view-dialog) {
    background-color: var(--bg-secondary);
    border-radius: 12px;
}

:deep(.profile-view-dialog .el-dialog__header) {
    padding: 0;
    border-bottom: none;
}

:deep(.profile-view-dialog .el-dialog__body) {
    padding: 20px;
}

.profile-view-content {
    display: flex;
    justify-content: center;
}

.profile-view-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.profile-view-avatar {
    margin-bottom: 16px;
    border: 3px solid var(--border-color);
    border-radius: 50%;
}

.profile-view-info {
    text-align: center;
    width: 100%;
}

.profile-view-nickname {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.profile-view-username {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 12px;
}

.profile-view-detail {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    font-size: 14px;
}

.profile-view-phone {
    color: var(--text-secondary);
}

/* About Dialog */
:deep(.about-dialog) {
    background-color: var(--bg-secondary);
    border-radius: 12px;
}

:deep(.about-dialog .el-dialog__header) {
    padding: 0;
    border-bottom: none;
}

:deep(.about-dialog .el-dialog__body) {
    padding: 30px 20px;
}

.about-content {
    text-align: center;
}

.about-header {
    margin-bottom: 20px;
}

.about-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
}

.about-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0 0 12px 0;
    font-weight: normal;
}

.about-version {
    display: inline-block;
    padding: 4px 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.about-description {
    font-size: 16px;
    color: var(--text-primary);
    margin: 16px 0 8px;
}

.about-feature {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 8px 0;
}

.about-partner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 16px 0;
    color: var(--text-primary);
    font-size: 14px;
}

.about-partner .el-icon {
    font-size: 18px;
    color: #00a4ff;
}

.about-author {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
}

.author-label {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 12px;
}

.author-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
}

.author-link {
    display: flex;
    align-items: center;
    color: var(--text-primary);
    text-decoration: none;
    transition: color 0.3s;
}

.author-link:hover {
    color: var(--accent-color);
}

.github-icon {
    width: 24px;
    height: 24px;
}

.author-contact {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-primary);
    font-size: 14px;
}

.author-contact .el-icon {
    font-size: 18px;
}

/* Settings List */
.settings-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background-color: var(--input-bg);
    border-radius: 8px;
    cursor: pointer;
    color: var(--text-primary);
}

.setting-item:hover {
    background-color: var(--bg-tertiary);
}

.logout-item {
    color: #ef4444;
}

/* Mobile Adaptation */
.bottom-nav {
    display: none;
}

@media (min-width: 769px) {
    .hidden-mobile {
        display: flex !important;
    }

    .show-mobile {
        display: none !important;
    }
}

@media (max-width: 768px) {
    .hidden-mobile {
        display: none !important;
    }

    .show-mobile {
        display: flex !important;
    }

    .sidebar {
        display: none;
    }

    .sub-sidebar {
        width: 100%;
        border-right: none;
        flex: 1;
    }

    .main-area {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 20;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        background-color: var(--bg-primary); /* Ensure solid background for chat */
    }

    .main-area.mobile-open {
        transform: translateX(0);
    }

    .chat-layout {
        flex-direction: column;
    }
    
    /* 移动端列表滚动优化 */
    .list-container {
        -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
    }
    
    /* 防止移动端下拉刷新干扰 */
    .sub-sidebar, .main-area {
        overscroll-behavior: contain;
    }

/* Mobile Bottom Nav Tweaks */
    .bottom-nav {
        height: 60px;
        background-color: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: space-around;
        align-items: center;
        flex-shrink: 0;
        padding-bottom: env(safe-area-inset-bottom);
        z-index: 100;
    }

    .bottom-nav .nav-item {
        flex-direction: column;
        gap: 4px;
        font-size: 10px;
        color: var(--nav-inactive-color, var(--text-secondary));
        background: transparent;
        height: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%; /* Evenly distribute tap area */
        transition: color 0.3s ease;
    }

    .bottom-nav .nav-item.active {
        color: var(--nav-active-color, var(--accent-color));
        background: transparent;
        box-shadow: none;
    }

    .bottom-nav .el-icon {
        font-size: 24px; /* Larger icons for mobile */
        margin-bottom: 2px;
    }

    .bottom-nav .nav-item .el-avatar {
        width: 24px;
        height: 24px;
        border: 2px solid transparent; /* Slightly thicker border for visibility */
        transition: border-color 0.3s ease;
    }

    .bottom-nav .nav-item.active .el-avatar {
        border-color: var(--nav-active-color, var(--accent-color));
    }

    .chat-header {
        padding: 0 16px;
        height: 56px; /* Reduced height for mobile */
    }

    .header-info h3 {
        font-size: 15px; /* Slightly smaller title */
    }

    .back-btn {
        margin-right: 8px;
        font-size: 18px; /* Ensure icon is touch-friendly */
    }
    
    .input-section {
        padding: 10px 16px;
        padding-bottom: calc(10px + env(safe-area-inset-bottom));
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .message-input {
        height: 40px; /* Reduced height */
        flex: 1; /* Input takes remaining space */
    }

    /* Move send button to right */
    .input-section .send-btn,
    .input-section button.send-btn {
        order: 2;
        width: 40px;
        height: 40px;
        padding: 0;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    /* Adjust other buttons in input section */
    .input-section .tool-btn {
        padding: 8px;
    }
}
/* 移动端顶部状态栏适配 */
.chat-container {
    padding-top: env(safe-area-inset-top);
    background-color: var(--bg-primary); /* Ensure background covers status bar */
}

/* 确保移动端聊天窗口头部不被遮挡 */
@media (max-width: 768px) {
    .chat-header {
        /* Remove explicit padding-top here if main-area has it, BUT main-area pushes everything down. */
        /* If we want header background to cover status bar, header needs padding-top. */
        padding-top: max(10px, env(safe-area-inset-top)); 
        height: auto; 
        min-height: 44px; /* Reduced */
        padding-bottom: 8px;
        align-items: flex-end; /* Align content to bottom of header area */
    }
    
    .mobile-header {
        padding-top: env(safe-area-inset-top);
        padding-bottom: 5px;
    }

    .main-area {
        /* Remove padding-top from main-area so content starts at top (behind status bar for header bg) */
        padding-top: 0; 
        height: 100vh; 
    }

    .list-container {
        /* Adjust height calculation for reduced header */
        /* Assuming search header ~60px (reduced), bottom nav 60px */
        height: calc(100vh - 120px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
        padding-bottom: 10px;
        flex: none;
    }

    /* 修复聊天界面底部导航栏位置 */
    .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 60px;
        background-color: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 100;
        padding-bottom: env(safe-area-inset-bottom);
    }

    /* Mobile Input Section Layout - Reverting to Desktop-like structure */
    .input-section {
        display: flex;
        flex-direction: column; /* Vertical stack like desktop */
        align-items: stretch;
        gap: 8px;
        padding: 12px 16px; 
        padding-bottom: calc(12px + env(safe-area-inset-bottom));
        background-color: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
    }

    .input-footer {
        display: flex; /* Restore footer flex */
        justify-content: flex-end; /* Send button on right */
        align-items: center;
        margin-top: 4px;
    }

    .toolbar {
        order: 1;
        margin-bottom: 4px; 
        gap: 16px; /* Restore desktop gap */
        display: flex;
        justify-content: flex-start;
    }

    .toolbar .tool-icon {
        font-size: 24px; /* Larger touch targets */
        padding: 4px; 
    }
    
    /* Restore all icons */
    .toolbar .tool-icon:nth-child(3), 
    .toolbar .tool-icon:nth-child(4) { 
        display: flex;
    }

    .message-input {
        order: 2;
        flex: none; /* Don't flex, use fixed height */
        width: 100%;
        height: 80px; /* Match desktop height */
        border-radius: 8px; 
        background-color: var(--input-bg);
        padding: 10px;
        margin: 0;
        resize: none; 
        font-size: 16px; /* Prevent iOS zoom */
    }

    .send-btn {
        order: 3;
        width: auto !important;
        height: 36px !important;
        padding: 0 20px !important;
        border-radius: 6px !important; 
        display: flex !important;
        justify-content: center;
        align-items: center;
        min-width: 60px;
        font-size: 14px;
        margin-left: 0;
        background-color: var(--accent-color);
        color: white;
        border: none;
    }
    
    /* Hide hint text on mobile */
    .hint {
        display: none;
    }
}

/* File Message Styles */
.file-bubble {
    display: inline-block;
    max-width: 320px;
}

.file-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.3s ease;
    cursor: pointer;
}

.file-link:hover {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
    border-color: rgba(102, 126, 234, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
    flex-shrink: 0;
}

.file-icon .el-icon {
    font-size: 20px;
}

.file-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.file-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
}

.file-size {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 400;
}

.file-download {
    font-size: 18px;
    color: var(--accent-color);
    flex-shrink: 0;
    transition: transform 0.3s ease;
}

.file-link:hover .file-download {
    transform: translateX(3px);
}

/* Sent message file style adjustment */
.sent .file-link {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
}

/* Received message file style adjustment */
.received .file-link {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}
/* Context Menu Mobile Style */
@media (max-width: 768px) {
  .msg-context-menu {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 200px !important;
    box-shadow: 0 0 20px rgba(0,0,0,0.5) !important;
    border-radius: 12px !important;
    z-index: 9999 !important;
    background-color: var(--bg-secondary) !important;
  }
  
  .msg-context-menu::before {
    content: '';
    position: fixed;
    top: -50vh;
    left: -50vw;
    width: 200vw;
    height: 200vh;
    background: rgba(0,0,0,0.3);
    z-index: -1;
  }
  
  .action-item {
    padding: 15px 20px !important;
    text-align: center;
    border-bottom: 1px solid var(--border-color);
  }
  
  .action-item:last-child {
    border-bottom: none;
  }
}
</style>

<style>
/* Global overrides for Element Plus components in dark mode */
html.dark .el-message-box,
html.dark .el-dialog {
    background-color: #1e1e1e;
    border-color: #333;
    --el-text-color-primary: #e5e5e5;
    --el-text-color-regular: #cfcfcf;
    color: #e5e5e5;
}
html.dark .el-message-box__title,
html.dark .el-dialog__title {
    color: #e5e5e5;
}
html.dark .el-message-box__content,
html.dark .el-dialog__body {
    color: #cfcfcf;
}
html.dark .el-message-box__close,
html.dark .el-dialog__headerbtn .el-dialog__close {
    color: #999;
}
html.dark .el-message-box__close:hover,
html.dark .el-dialog__headerbtn .el-dialog__close:hover {
    color: #fff;
}
.dialog-friend-name {
    color: var(--text-primary);
    font-size: 14px !important; /* Force font size to prevent 0px inheritance */
    line-height: 1.5;
    display: inline-block;
    width: auto;
    height: auto;
    flex: 1; /* Ensure it takes available space */
}
html.dark .dialog-friend-name {
    color: #e5e5e5;
}
/* Override Element Plus Checkbox label hiding */
.friend-select-item .el-checkbox__label {
    display: none;
}
/* Ensure container has font size */
.friend-select-item {
    font-size: 14px;
}

/* Upload Progress Overlay Styles */
.upload-progress-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    padding: 8px 12px;
    border-radius: 0 0 8px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 10;
}

/* Moment Image Preview Enhancement */
.el-image-viewer__wrapper {
    background-color: rgba(0, 0, 0, 0.9) !important;
}

.el-image-viewer__btn {
    color: #fff !important;
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.el-image-viewer__btn:hover {
    background-color: rgba(255, 255, 255, 0.2) !important;
}

.el-image-viewer__actions {
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-radius: 20px !important;
    padding: 0 20px !important;
}

.el-image-viewer__canvas img {
    border-radius: 4px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.moment-img {
    cursor: zoom-in;
    transition: transform 0.3s ease;
}

.moment-img:hover {
    transform: scale(1.02);
}
</style>
