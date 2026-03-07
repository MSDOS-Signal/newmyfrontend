import axios from 'axios'

const API_BASE_URL = '/api'

// Local Backend URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

// Add request interceptor to include token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    // 不要手动设置 Content-Type，让浏览器自动设置（包括 boundary 参数）
    // 这样可以避免触发 CORS 预检请求
    return config
}, error => {
    return Promise.reject(error)
})

// Add response interceptor to handle token expiration
api.interceptors.response.use(
    response => response,
    error => {
        // If 401 or 403, redirect to login
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error('Token expired or invalid, redirecting to login...')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            // Redirect to login page
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const searchUsers = (keyword) => api.get('/users/search', { params: { keyword } })
export const updateSettings = (id, data) => api.put(`/users/${id}/settings`, data)
export const getUnreadCounts = (userId) => api.get(`/users/${userId}/unread`)
export const markRead = (userId, type) => api.post(`/users/${userId}/read/${type}`)
export const uploadFile = async (formData) => {
    // 使用原生 fetch 而非 axios，避免 axios 的某些配置问题
    const token = localStorage.getItem('token')
    
    try {
        const response = await fetch(`${api.defaults.baseURL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // 不设置 Content-Type，让浏览器自动处理
            },
            body: formData
        })
        
        if (!response.ok) {
            const error = new Error(`Upload failed with status ${response.status}`)
            error.response = response
            throw error
        }
        
        const data = await response.json()
        console.log('File upload successful:', data)
        return { data }
    } catch (error) {
        console.error('File upload error:', error)
        throw error
    }
}

// Friends API
export const sendFriendRequest = (receiverId, reason) => api.post(`/friends/request/${receiverId}`, null, { params: { reason } })
export const getFriendRequests = () => api.get('/friends/requests')
export const acceptFriendRequest = (requestId) => api.post(`/friends/accept/${requestId}`)
export const rejectFriendRequest = (requestId) => api.post(`/friends/reject/${requestId}`)
export const getFriends = () => api.get('/friends')
export const deleteFriend = (friendId) => api.delete(`/friends/${friendId}`)

// Moments API
export const publishMoment = (data) => api.post('/moments', data)
export const getMoments = () => api.get('/moments')
export const likeMoment = (id) => api.post(`/moments/${id}/like`)
export const commentMoment = (id, content, replyToUserId) => api.post(`/moments/${id}/comment`, { content, replyToUserId })
export const deleteMoment = (id) => api.delete(`/moments/${id}`)

// Chat & Group API
export const sendMessage = (data) => api.post('/messages', data)
export const recallMessage = (messageId) => api.post(`/messages/${messageId}/recall`)
export const getMessages = (friendId, groupId) => api.get('/messages', { params: { friendId, groupId } })
export const createGroup = (name, memberIds) => api.post('/groups', { name, memberIds })
export const getMyGroups = () => api.get('/groups')
export const inviteGroupMembers = (groupId, memberIds) => api.post(`/groups/${groupId}/invite`, { memberIds })
export const updateGroup = (groupId, data) => api.put(`/groups/${groupId}`, data)
export const pinGroup = (groupId, pinned) => api.post(`/groups/${groupId}/pin`, { pinned })
export const pinFriend = (friendId, pinned) => api.post(`/friends/${friendId}/pin`, { pinned })
export const kickMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`)
export const muteMember = (groupId, userId, minutes) => api.post(`/groups/${groupId}/members/${userId}/mute`, { minutes })
export const unmuteMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}/mute`)
export const deleteGroup = (groupId) => api.delete(`/groups/${groupId}`)
export const getGroupRequests = () => api.get('/groups/requests')
export const acceptGroupRequest = (requestId) => api.post(`/groups/requests/${requestId}/accept`)
export const rejectGroupRequest = (requestId) => api.post(`/groups/requests/${requestId}/reject`)

// AI API
export const sendAiMessage = (content) => api.post('/ai/chat', { content })

export default api
