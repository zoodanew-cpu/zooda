import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, Plus, X, Heart, MessageCircle, Clock, Edit, Trash2, Send
} from 'lucide-react';
import axios from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PostsScreenProps {
  business: any;
  currentUser: any;
  notify: (type: string, message: string) => void;
}

// Post Create Form Modal
const PostCreateForm = ({ businessId, onClose, onSuccess, notify, existingPost }: any) => {
  const defaultTags = ['General', 'Offer', 'Update', 'Announcement'];

  const [formData, setFormData] = useState({
    content: existingPost?.content || '',
    scheduledFor: existingPost?.scheduledFor
      ? new Date(existingPost.scheduledFor).toISOString().slice(0, 16)
      : '',
    category: existingPost?.category || '',
  });

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [postLoading, setPostLoading] = useState(false);

  // default tags + existing category if editing
  const [categories, setCategories] = useState<string[]>(
    existingPost?.category
      ? Array.from(new Set([existingPost.category, ...defaultTags]))
      : defaultTags
  );
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const formatted = newCategory.trim();
    if (!categories.includes(formatted)) {
      setCategories([...categories, formatted]);
    }
    setFormData((prev) => ({ ...prev, category: formatted }));
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    if (formData.category === cat) {
      setFormData((prev) => ({ ...prev, category: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostLoading(true);

    const data = new FormData();
    data.append('businessId', businessId);
    data.append('content', formData.content);
    data.append('scheduledFor', formData.scheduledFor);
    data.append('category', formData.category);

    if (mediaFile) data.append('media', mediaFile);

    try {
      if (existingPost) {
        await axios.put(`/posts/${existingPost._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        notify('success', 'Post updated successfully.');
      } else {
        await axios.post('/posts', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        notify('success', 'Post created successfully.');
      }
      onSuccess();
    } catch (err: any) {
      notify('error', err.response?.data?.message || 'Post failed!');
    } finally {
      setPostLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">
            {existingPost ? 'Edit Post' : 'Create New Post'}
          </h3>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <textarea
              placeholder="What would you like to share?"
              value={formData.content}
              required
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input-field min-h-[120px] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Categories</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add a category..."
                className="input-field flex-1"
              />
              <button type="button" onClick={handleAddCategory} className="btn-primary px-4">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                  className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all ${
                    formData.category === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCategory(cat);
                    }}
                    className="ml-2 text-xs hover:text-destructive"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Media</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
            />
            {existingPost?.mediaUrl && !mediaFile && (
              <img src={existingPost.mediaUrl} className="w-32 h-32 object-cover rounded-xl mt-3" alt="current" />
            )}
          </div>

          <button
            type="submit"
            disabled={postLoading || !formData.category}
            className="btn-primary w-full"
          >
            {postLoading ? 'Saving...' : existingPost ? 'Update Post' : 'Create Post'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// Comment Section Component
const CommentSection = ({ postId, comments, setComments, notify, currentUser }: any) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return notify('info', 'Please log in to comment.');
    if (!newCommentText.trim()) return;

    setIsCommenting(true);
    try {
      const res = await axios.post(`/post/${postId}/comment`, {
        userId: currentUser._id,
        text: newCommentText.trim(),
      });

      const newComment = {
        ...res.data.comment,
        userId: { _id: currentUser._id, name: `${currentUser.firstName} ${currentUser.lastName}` },
      };

      setComments((prev: any) => [...prev, newComment]);
      setNewCommentText('');
      notify('success', 'Comment added!');
    } catch (err) {
      notify('error', 'Failed to add comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return notify('info', 'Please log in first.');
    if (!window.confirm('Delete this comment?')) return;

    setDeletingId(commentId);
    try {
      await axios.delete(`/api/post/${postId}/comment/${commentId}`);
      setComments((prev: any) => prev.filter((c: any) => c._id !== commentId));
      notify('success', 'Comment deleted!');
    } catch (err) {
      notify('error', 'Failed to delete comment.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      <h4 className="text-sm font-semibold text-foreground">Comments ({comments.length})</h4>

      <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
        {comments.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4">No comments yet.</p>
        )}
        {comments.map((comment: any) => (
          <div key={comment._id} className="p-3 bg-secondary/50 rounded-xl text-sm relative">
            <p className="font-medium text-foreground">{comment?.userId?.name || 'User'}</p>
            <p className="text-muted-foreground mt-1">{comment.text}</p>
            {currentUser && comment?.userId?._id === currentUser._id && (
              <button
                onClick={() => handleDeleteComment(comment._id)}
                disabled={deletingId === comment._id}
                className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
              >
                {deletingId === comment._id ? '...' : <Trash2 size={14} />}
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleCommentSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={isCommenting || !currentUser}
          className="btn-primary px-4"
        >
          {isCommenting ? '...' : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

// Likes Modal
const LikesModal = ({ likesList, onClose }: any) => (
  <div className="modal-overlay" onClick={onClose}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[70vh] overflow-y-auto"
    >
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Liked by</h2>
      </div>
      <div className="p-4">
        {likesList.length > 0 ? (
          <ul className="divide-y divide-border">
            {likesList.map((user: any) => (
              <li key={user._id} className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-8">No likes yet.</p>
        )}
      </div>
      <div className="p-4 border-t border-border">
        <button onClick={onClose} className="btn-primary w-full">Close</button>
      </div>
    </motion.div>
  </div>
);

// Post Card Component
const PostCard = ({ post, notify, currentUser, onDelete, onEdit }: any) => {
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [likesList, setLikesList] = useState(post.likesList || []);
  const [showLikes, setShowLikes] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);

  const checkLikeStatus = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(`/post/${post._id}/like-status/${currentUser._id}`);
      setIsLiked(res.data.isLiked);
    } catch (err) {
      console.error('Failed to check like status:', err);
    }
  };

  useEffect(() => {
    checkLikeStatus();
  }, [post._id, currentUser]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/post/${post._id}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      notify('error', 'Failed to fetch comments.');
    }
  };

  const handleLike = async () => {
    if (!currentUser) return notify('info', 'Please log in to interact with posts.');

    try {
      const res = await axios.post(`/post/${post._id}/like`, { userId: currentUser._id });
      setLikes(res.data.likesCount);
      setIsLiked(res.data.isLiked);

      const updated = await axios.get(`/post/${post.business}`);
      const current = updated.data.posts.find((p: any) => p._id === post._id);
      if (current) setLikesList(current.likesList);

      notify('success', res.data.isLiked ? 'Post liked!' : 'Post unliked!');
    } catch (err) {
      notify('error', 'Failed to toggle like.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden card-hover"
    >
      {post.mediaUrl && (
        <div className="relative">
          <img
            src={post.mediaUrl}
            alt="Post Media"
            className="w-full h-64 object-cover"
            onError={(e: any) => {
              e.target.src = 'https://placehold.co/600x400/1a1a2e/ffffff?text=Image+Not+Found';
            }}
          />
          {currentUser && (post.user === currentUser._id || post.business === currentUser._id) && (
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => onEdit(post)}
                className="p-2 bg-info text-white rounded-full hover:bg-info/80 transition-colors"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => onDelete(post._id)}
                className="p-2 bg-destructive text-white rounded-full hover:bg-destructive/80 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {!post.mediaUrl && currentUser && (post.user === currentUser._id || post.business === currentUser._id) && (
          <div className="flex gap-2 mb-4 justify-end">
            <button
              onClick={() => onEdit(post)}
              className="p-2 bg-info/10 text-info rounded-lg hover:bg-info/20 transition-colors"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(post._id)}
              className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <p className="text-foreground mb-3">{post.content}</p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock size={14} />
          <span>{new Date(post.createdAt).toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-sm font-medium hover:text-destructive transition-colors"
            >
              <Heart
                size={18}
                className={isLiked ? 'fill-destructive text-destructive' : 'text-muted-foreground'}
              />
              {likes}
            </button>

            {likes > 0 && (
              <button
                onClick={() => setShowLikes(true)}
                className="text-sm text-primary hover:underline"
              >
                View
              </button>
            )}

            <button
              onClick={() => {
                setShowComments(!showComments);
                if (!showComments) fetchComments();
              }}
              className="flex items-center gap-1.5 text-sm font-medium hover:text-info transition-colors"
            >
              <MessageCircle size={18} className="text-muted-foreground" />
              {comments.length}
            </button>
          </div>
        </div>

        {showComments && (
          <CommentSection
            postId={post._id}
            comments={comments}
            setComments={setComments}
            notify={notify}
            currentUser={currentUser}
          />
        )}
      </div>

      <AnimatePresence>
        {showLikes && <LikesModal likesList={likesList} onClose={() => setShowLikes(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};

// Main Posts Screen
const PostsScreen = ({ business, currentUser, notify }: PostsScreenProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const businessId = business?._id;

  const fetchPosts = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`/post/${businessId}`);
      setPosts(res.data.posts || []);
    } catch (error) {
      notify('error', 'Failed to fetch posts.');
    } finally {
      setLoading(false);
    }
  }, [businessId, notify]);

  useEffect(() => {
    if (businessId) fetchPosts();
  }, [businessId, fetchPosts]);

  const handlePostCreated = () => {
    setIsPostFormOpen(false);
    setEditingPost(null);
    fetchPosts();
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setIsPostFormOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await axios.delete(`/post/${postId}`);
      notify('success', 'Post deleted successfully.');
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (error) {
      notify('error', 'Failed to delete post.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading Posts..." />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Image className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Content Manager</h1>
            <p className="text-muted-foreground text-sm">Create and manage your posts</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingPost(null);
            setIsPostFormOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          New Post
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              notify={notify}
              currentUser={currentUser}
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-card rounded-2xl border border-border">
            <Image size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6">Create your first post to get started</p>
            <button
              onClick={() => setIsPostFormOpen(true)}
              className="btn-primary"
            >
              Create Post
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPostFormOpen && (
          <PostCreateForm
            businessId={businessId}
            onClose={() => {
              setIsPostFormOpen(false);
              setEditingPost(null);
            }}
            onSuccess={handlePostCreated}
            notify={notify}
            existingPost={editingPost}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostsScreen;
