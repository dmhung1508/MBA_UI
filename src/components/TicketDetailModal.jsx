import React, { useState, useEffect } from 'react';
import { FaTimes, FaComment, FaCheckCircle, FaRedo, FaSpinner, FaPaperclip, FaImage, FaTrash, FaFile, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../config/api';

const TicketDetailModal = ({ isOpen, onClose, ticketNumber, onUpdate }) => {
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [commentImageUrls, setCommentImageUrls] = useState({});

  const fetchTicketDetail = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.TICKET_DETAIL(ticketNumber), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data);

        // Fetch images with auth for preview
        if (data.attachments && data.attachments.length > 0) {
          const urls = {};
          for (const attachment of data.attachments) {
            if (/\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.filename)) {
              try {
                const downloadUrl = API_ENDPOINTS.TICKET_DOWNLOAD_ATTACHMENT(data.ticket_number, attachment.filename);
                const imgResponse = await fetch(downloadUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                if (imgResponse.ok) {
                  const blob = await imgResponse.blob();
                  urls[attachment.filename] = URL.createObjectURL(blob);
                } else {
                  const errorText = await imgResponse.text();
                  console.error('Failed to load image:', attachment.filename, errorText);
                }
              } catch (err) {
                console.error('Error loading image:', attachment.filename, err);
              }
            }
          }
          setImageUrls(urls);
        }

        // Fetch comment attachment images
        if (data.comments && data.comments.length > 0) {
          const commentUrls = {};
          for (const comment of data.comments) {
            if (comment.attachments && comment.attachments.length > 0) {
              for (const attachment of comment.attachments) {
                if (/\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.filename)) {
                  try {
                    const downloadUrl = API_ENDPOINTS.COMMENT_DOWNLOAD_ATTACHMENT(comment.id, attachment.filename);
                    const imgResponse = await fetch(downloadUrl, {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    if (imgResponse.ok) {
                      const blob = await imgResponse.blob();
                      commentUrls[`${comment.id}_${attachment.filename}`] = URL.createObjectURL(blob);
                    }
                  } catch (err) {
                    console.error('Error loading comment image:', attachment.filename, err);
                  }
                }
              }
            }
          }
          setCommentImageUrls(commentUrls);
        }
      } else {
        toast.error('Không thể tải chi tiết ticket');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching ticket detail:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticketNumber) {
      fetchTicketDetail();
    }

    // Cleanup blob URLs when modal closes
    return () => {
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
      Object.values(commentImageUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [isOpen, ticketNumber]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const token = localStorage.getItem('access_token');

      // Step 1: Create the comment
      const response = await fetch(API_ENDPOINTS.TICKET_ADD_COMMENT(ticketNumber), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ comment: newComment, is_internal: false })
      });

      if (!response.ok) {
        toast.error('Không thể thêm bình luận');
        return;
      }

      const result = await response.json();
      const commentId = result.comment_id;

      // Step 2: Upload attachments if any
      if (commentAttachments.length > 0) {
        for (const attachment of commentAttachments) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', attachment.file);

          try {
            const uploadResponse = await fetch(API_ENDPOINTS.COMMENT_UPLOAD_ATTACHMENT(commentId), {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
              },
              body: uploadFormData
            });

            if (!uploadResponse.ok) {
              console.error('Failed to upload attachment:', attachment.file.name);
            }
          } catch (uploadError) {
            console.error('Error uploading attachment:', uploadError);
          }
        }
      }

      toast.success('Đã thêm bình luận');
      setNewComment('');
      setCommentAttachments([]);
      // Clean up preview URLs
      commentAttachments.forEach(att => URL.revokeObjectURL(att.preview));
      fetchTicketDetail();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Limit to 5 files
    if (commentAttachments.length + files.length > 5) {
      toast.error('Tối đa 5 file');
      return;
    }

    // Validate file size (max 10MB per file)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Mỗi file không được vượt quá 10MB');
      return;
    }

    // Add preview URLs for images
    const filesWithPreview = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      type: file.type
    }));

    setCommentAttachments([...commentAttachments, ...filesWithPreview]);
  };

  const removeCommentAttachment = (index) => {
    const newAttachments = commentAttachments.filter((_, i) => i !== index);
    // Revoke the object URL to free memory
    if (commentAttachments[index].preview) {
      URL.revokeObjectURL(commentAttachments[index].preview);
    }
    setCommentAttachments(newAttachments);
  };

  const handleDownloadCommentFile = async (commentId, filename) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.COMMENT_DOWNLOAD_ATTACHMENT(commentId, filename), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        toast.error('Không thể tải file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Lỗi kết nối');
    }
  };

  const handleCloseTicket = async () => {
    setIsClosing(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.TICKET_CLOSE(ticketNumber), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Đã đóng ticket');
        fetchTicketDetail();
        onUpdate?.();
      } else {
        toast.error('Không thể đóng ticket');
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopenTicket = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.TICKET_REOPEN(ticketNumber), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Đã mở lại ticket');
        fetchTicketDetail();
        onUpdate?.();
      } else {
        toast.error('Không thể mở lại ticket');
      }
    } catch (error) {
      console.error('Error reopening ticket:', error);
      toast.error('Lỗi kết nối');
    }
  };

  const handleMarkInProgress = async () => {
    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.ADMIN_TICKET_UPDATE(ticketNumber), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ status: 'in_progress' })
      });

      if (response.ok) {
        toast.success('Đã chuyển sang đang xử lý');
        fetchTicketDetail();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkResolved = async () => {
    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.ADMIN_TICKET_UPDATE(ticketNumber), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      });

      if (response.ok) {
        toast.success('Đã đánh dấu là đã xử lý');
        fetchTicketDetail();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      open: 'Mở',
      in_progress: 'Đang xử lý',
      resolved: 'Đã giải quyết',
      closed: 'Đã đóng'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : ticket ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
                  <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <FaTimes size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Mô tả</h3>
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                <p className="text-xs text-gray-500 mt-3">
                  Tạo bởi <span className="font-medium">{ticket.created_by?.name || ticket.created_by?.username || 'Unknown'}</span>
                  <span className="text-gray-400"> (@{ticket.created_by?.username || 'unknown'})</span> vào{' '}
                  {new Date(ticket.created_at).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    File đính kèm ({ticket.attachments.length})
                  </h3>

                  {/* Image Gallery */}
                  {Object.keys(imageUrls).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Hình ảnh</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {ticket.attachments.filter(att => /\.(jpg|jpeg|png|gif|webp)$/i.test(att.filename)).map((attachment, idx) => {
                          const imageUrl = imageUrls[attachment.filename];
                          if (!imageUrl) return null;

                          return (
                            <div
                              key={idx}
                              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-red-400 transition-all cursor-pointer group"
                              onClick={() => setLightboxImage({ url: imageUrl, filename: attachment.filename })}
                            >
                              <img
                                src={imageUrl}
                                alt={attachment.filename}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                  Xem lớn
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Other Files */}
                  {ticket.attachments.filter(att => !/\.(jpg|jpeg|png|gif|webp)$/i.test(att.filename)).length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">File khác</h4>
                      <div className="space-y-2">
                        {ticket.attachments.filter(att => !/\.(jpg|jpeg|png|gif|webp)$/i.test(att.filename)).map((attachment, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{attachment.filename}</p>
                              <p className="text-xs text-gray-500">
                                {(attachment.file_size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('access_token');
                                  const response = await fetch(
                                    API_ENDPOINTS.TICKET_DOWNLOAD_ATTACHMENT(ticket.ticket_number, attachment.filename),
                                    { headers: { 'Authorization': `Bearer ${token}` } }
                                  );
                                  if (response.ok) {
                                    const blob = await response.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = attachment.filename;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  } else {
                                    toast.error('Không thể tải file');
                                  }
                                } catch (error) {
                                  console.error('Download error:', error);
                                  toast.error('Lỗi tải file');
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
                            >
                              Tải xuống
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Comments */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Bình luận ({ticket.comments?.length || 0})
                </h3>
                {ticket.comments && ticket.comments.length > 0 ? (
                  <div className="space-y-4">
                    {ticket.comments.map((comment, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{comment.user?.name || comment.user?.username || 'Unknown'}</span>
                            <span className="text-xs text-gray-500">@{comment.user?.username || 'unknown'}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{comment.comment}</p>

                        {/* Comment Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {comment.attachments.map((attachment, attIdx) => {
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.filename);
                                const commentId = comment.id;

                                return (
                                  <div key={attIdx} className="relative group">
                                    {isImage ? (
                                      <img
                                        src={commentImageUrls[`${commentId}_${attachment.filename}`]}
                                        alt={attachment.filename}
                                        className="w-24 h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setLightboxImage({
                                          url: commentImageUrls[`${commentId}_${attachment.filename}`],
                                          filename: attachment.filename
                                        })}
                                      />
                                    ) : (
                                      <button
                                        onClick={() => handleDownloadCommentFile(commentId, attachment.filename)}
                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                      >
                                        <FaFile className="text-gray-400" />
                                        <span className="text-sm text-gray-700 truncate max-w-[150px]">{attachment.filename}</span>
                                        <FaDownload className="text-gray-400 text-xs" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Chưa có bình luận nào</p>
                )}
              </div>

              {/* Add Comment */}
              {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Thêm bình luận</h3>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Nhập bình luận của bạn..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />

                  {/* File Upload */}
                  <div className="mt-3">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors text-sm">
                      <FaPaperclip className="mr-2 text-gray-600" />
                      <span className="text-gray-700">Đính kèm file (tối đa 5 file, mỗi file &lt;10MB)</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleCommentFileChange}
                        className="hidden"
                      />
                    </label>
                    {commentAttachments.length > 0 && (
                      <span className="ml-3 text-xs text-gray-500">
                        {commentAttachments.length}/5 file
                      </span>
                    )}
                  </div>

                  {/* Preview attachments */}
                  {commentAttachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                      {commentAttachments.map((attachment, index) => (
                        <div key={index} className="relative group">
                          {attachment.preview ? (
                            <img
                              src={attachment.preview}
                              alt={attachment.name}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                              <FaFile className="text-gray-400 text-3xl" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeCommentAttachment(index)}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTrash size={10} />
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">{attachment.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                  >
                    <FaComment className="mr-2" />
                    {isSubmittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>

              <div className="flex gap-2">
                {ticket.status === 'closed' || ticket.status === 'resolved' ? (
                  <button
                    onClick={handleReopenTicket}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
                  >
                    <FaRedo className="mr-2" />
                    Mở lại ticket
                  </button>
                ) : (
                  <>
                    {/* For bugs: show different buttons based on status */}
                    {ticket.type === 'bug' ? (
                      <>
                        {ticket.status === 'open' && (
                          <button
                            onClick={handleMarkInProgress}
                            disabled={isUpdatingStatus}
                            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                          >
                            <FaSpinner className="mr-2" />
                            {isUpdatingStatus ? 'Đang cập nhật...' : 'Đang xử lý'}
                          </button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <button
                            onClick={handleMarkResolved}
                            disabled={isUpdatingStatus}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                          >
                            <FaCheckCircle className="mr-2" />
                            {isUpdatingStatus ? 'Đang cập nhật...' : 'Đã xử lý'}
                          </button>
                        )}
                      </>
                    ) : (
                      /* For questions and feature requests: show close button */
                      <button
                        onClick={handleCloseTicket}
                        disabled={isClosing}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                      >
                        <FaCheckCircle className="mr-2" />
                        {isClosing ? 'Đang đóng...' : 'Đóng ticket'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-90"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
          >
            <FaTimes size={24} />
          </button>
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.filename}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black bg-opacity-50 py-2">
            {lightboxImage.filename}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailModal;
