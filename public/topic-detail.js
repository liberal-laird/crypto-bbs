// Topic Detail Manager
class TopicDetailManager {
    constructor() {
        this.currentTopic = null;
        this.comments = [];
        this.isLiked = false;
    }

    // Show topic detail
    async show(topicId) {
        try {
            const api = window.api;
            
            // Fetch topic
            const topic = await api.getTopic(topicId);
            this.currentTopic = topic;
            
            // Fetch comments
            const comments = await api.getTopicComments(topicId);
            this.comments = comments;
            
            // Update UI
            this.render(topic, comments);
            
            // Switch to detail view
            document.getElementById('topicList').style.display = 'none';
            document.getElementById('topicDetail').classList.add('active');
            
            // Update URL without reload
            history.pushState({ topicId }, '', `?topic=${topicId}`);
            
        } catch (error) {
            console.error('Failed to load topic:', error);
            showToast('加载帖子失败', 'error');
        }
    }

    // Render topic detail
    render(topic, comments) {
        // Title
        document.getElementById('detailTitle').textContent = topic.title;
        
        // Author
        const avatar = document.getElementById('detailAvatar');
        avatar.textContent = topic.avatar || topic.username?.substring(0, 2) || 'U';
        avatar.onclick = () => openUserProfile(topic.author_id);
        
        const authorName = document.getElementById('detailAuthor');
        authorName.textContent = topic.username || '匿名用户';
        authorName.onclick = () => openUserProfile(topic.author_id);
        
        // Badge
        const badge = document.getElementById('detailBadge');
        if (topic.role === 'vip') {
            badge.textContent = 'VIP';
            badge.className = 'badge badge-vip';
        } else if (topic.role === 'expert') {
            badge.textContent = '专家';
            badge.className = 'badge badge-expert';
        } else {
            badge.textContent = '';
            badge.className = 'badge';
        }
        
        // Meta info
        const time = document.getElementById('detailTime');
        time.textContent = this.formatTime(topic.created_at);
        
        const section = document.getElementById('detailSection');
        const sectionNames = {
            'follow': '跟单讨论',
            'arbitrage': '套利讨论',
            'general': '现货交流'
        };
        section.textContent = sectionNames[topic.section] || topic.section;
        
        // Content
        const content = document.getElementById('detailContent');
        content.innerHTML = this.formatContent(topic.content);
        
        // Tags
        const tags = document.getElementById('detailTags');
        const tagsHtml = Array.isArray(topic.tags) ? topic.tags : [];
        tags.innerHTML = tagsHtml.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        // Stats
        document.getElementById('likeCount').textContent = topic.likes_count || 0;
        document.getElementById('commentCount').textContent = topic.comments_count || 0;
        document.getElementById('commentsCount').textContent = comments.length;
        
        // Render comments
        this.renderComments(comments);
        
        // Update like button state
        this.updateLikeButton();
    }

    // Render comments
    renderComments(comments) {
        const container = document.getElementById('commentList');
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-dim);">暂无评论，快来抢沙发！</div>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="avatar" style="width: 40px; height: 40px; font-size: 0.9rem;">
                    ${comment.avatar || comment.username?.substring(0, 2) || 'U'}
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-username">${comment.username || '匿名'}</span>
                        <span class="comment-time">${this.formatTime(comment.created_at)}</span>
                    </div>
                    <div class="comment-text">${this.escapeHtml(comment.content)}</div>
                </div>
            </div>
        `).join('');
    }

    // Submit new comment
    async submitComment() {
        const input = document.getElementById('commentInput');
        const content = input.value.trim();
        
        if (!content) {
            showToast('请输入评论内容', 'error');
            return;
        }
        
        if (!isWalletConnected()) {
            showToast('请先连接钱包', 'error');
            await handleWalletClick();
            return;
        }
        
        try {
            const walletAddress = getWalletAddress();
            api.setWalletAddress(walletAddress);
            
            const comment = await api.createComment(this.currentTopic.id, { content });
            
            // Add to comments list
            this.comments.push(comment);
            this.renderComments(this.comments);
            
            // Update count
            document.getElementById('commentsCount').textContent = this.comments.length;
            document.getElementById('commentCount').textContent = parseInt(document.getElementById('commentCount').textContent) + 1;
            
            // Clear input
            input.value = '';
            
            showToast('评论发布成功！', 'success');
            
        } catch (error) {
            console.error('Failed to submit comment:', error);
            showToast(error.message || '评论失败，请重试', 'error');
        }
    }

    // Like topic
    async like() {
        if (!isWalletConnected()) {
            showToast('请先连接钱包', 'error');
            await handleWalletClick();
            return;
        }
        
        try {
            const walletAddress = getWalletAddress();
            api.setWalletAddress(walletAddress);
            
            if (this.isLiked) {
                await api.unlikeTopic(this.currentTopic.id);
                this.isLiked = false;
                document.getElementById('likeCount').textContent = parseInt(document.getElementById('likeCount').textContent) - 1;
                showToast('已取消点赞', 'info');
            } else {
                await api.likeTopic(this.currentTopic.id);
                this.isLiked = true;
                document.getElementById('likeCount').textContent = parseInt(document.getElementById('likeCount').textContent) + 1;
                showToast('点赞成功！', 'success');
            }
            
            this.updateLikeButton();
            
        } catch (error) {
            console.error('Failed to like:', error);
            showToast('操作失败，请重试', 'error');
        }
    }

    // Update like button style
    updateLikeButton() {
        const btn = document.getElementById('likeBtn');
        if (this.isLiked) {
            btn.innerHTML = `❤️ <span>${document.getElementById('likeCount').textContent}</span>`;
            btn.classList.add('liked');
        } else {
            btn.innerHTML = `🤍 <span>${document.getElementById('likeCount').textContent}</span>`;
            btn.classList.remove('liked');
        }
    }

    // Format time
    formatTime(dateStr) {
        if (!dateStr) return '';
        
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
        
        return date.toLocaleDateString('zh-CN');
    }

    // Format content
    formatContent(content) {
        if (!content) return '';
        
        // Escape HTML first
        let html = this.escapeHtml(content);
        
        // Convert newlines to paragraphs
        html = html.split('\n\n').map(p => `<p>${p}</p>`).join('');
        
        // Convert single newlines to <br>
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.topicDetail = new TopicDetailManager();
console.log('📄 Topic detail manager initialized');
