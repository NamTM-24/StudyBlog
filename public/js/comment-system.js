// Comment System JavaScript - Reusable across all pages
class CommentSystem {
  constructor(options = {}) {
    this.currentUser = options.currentUser || null;
    this.currentPostSlug = options.currentPostSlug || "home";
    this.comments = [];
    this.apiBase = options.apiBase || "/api/posts";
    this.init();
  }

  init() {
    this.loadComments();
    this.bindEvents();
  }

  // Utility functions
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  // Wrapper fetch có tự động refresh access token khi 401/403
  async authFetch(input, init = {}, retry = true) {
    const headers = new Headers(init.headers || {});
    const token = this.getCookie("accessToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(input, { ...init, headers });

    if ((response.status === 401 || response.status === 403) && retry) {
      try {
        const refreshRes = await fetch("/refresh-token", { method: "POST" });
        if (refreshRes.ok) {
          const newHeaders = new Headers(init.headers || {});
          const newToken = this.getCookie("accessToken");
          if (newToken) newHeaders.set("Authorization", `Bearer ${newToken}`);
          return await fetch(input, { ...init, headers: newHeaders });
        }
      } catch (e) {
        // bỏ qua, sẽ ném lỗi phía dưới
      }
    }

    return response;
  }

  // API functions
  async createComment(content, parentId = null) {
    try {
      const response = await this.authFetch(
        `${this.apiBase}/${this.currentPostSlug}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Không thể tạo comment");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi tạo comment:", error);

      // Hiển thị thông báo lỗi cho user
      if (error.message.includes("đăng nhập")) {
        this.showAuthError(
          "Bạn phải đăng nhập để comment. Vui lòng <a href='/login' class='underline'>đăng nhập</a> hoặc <a href='/register' class='underline'>đăng ký</a>."
        );
      } else {
        this.showError(error.message);
      }

      throw error;
    }
  }

  async deleteComment(commentId) {
    try {
      const response = await this.authFetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Không thể xóa comment");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi xóa comment:", error);

      if (error.message.includes("đăng nhập")) {
        this.showAuthError("Bạn phải đăng nhập để xóa comment.");
      } else {
        this.showError(error.message);
      }

      throw error;
    }
  }

  async updateComment(commentId, content) {
    try {
      const response = await this.authFetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Không thể cập nhật comment");
      }

      return await response.json();
    } catch (error) {
      console.error("Lỗi cập nhật comment:", error);

      if (error.message.includes("đăng nhập")) {
        this.showAuthError("Bạn phải đăng nhập để chỉnh sửa comment.");
      } else {
        this.showError(error.message);
      }

      throw error;
    }
  }

  // UI functions
  createCommentHTML(comment, isReply = false) {
    const canEdit =
      this.currentUser &&
      (this.currentUser.id === comment.author.id ||
        this.currentUser.role === "ADMIN");

    if (isReply) {
      // Reply comment template
      return `
        <article class="p-4 mb-4 ml-8 text-base bg-gray-50 rounded-lg dark:bg-gray-700 border-l-4 border-primary-700" data-comment-id="${
          comment.id
        }">
          <footer class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <p class="inline-flex items-center mr-3 font-semibold text-sm text-primary-700 dark:text-primary-400">
                ${comment.author.name}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <time pubdate datetime="${comment.createdAt}">
                  ${this.formatDate(comment.createdAt)}
                </time>
              </p>
            </div>

            ${
              canEdit
                ? `
              <div class="relative">
                <button type="button" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" onclick="commentSystem.toggleCommentMenu(${comment.id})">
                  <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 16 3">
                    <circle cx="2" cy="1.5" r="1.5" />
                    <circle cx="8" cy="1.5" r="1.5" />
                    <circle cx="14" cy="1.5" r="1.5" />
                  </svg>
                </button>
                <div id="cmt-menu-${comment.id}" class="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 hidden z-10">
                  <ul class="py-1 text-sm text-gray-700 dark:text-gray-200">
                    <li>
                      <button type="button" class="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onclick="commentSystem.showEditForm(${comment.id})">
                        Chỉnh sửa
                      </button>
                    </li>
                    <li>
                      <button type="button" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400" onclick="commentSystem.deleteCommentHandler(${comment.id})">
                        Xoá
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            `
                : ""
            }
          </footer>

          <p class="text-gray-500 dark:text-gray-400" id="comment-content-${
            comment.id
          }">${comment.content}</p>

          ${
            canEdit
              ? `
            <div id="edit-form-${comment.id}" class="hidden mt-2">
              <textarea rows="3" class="border rounded w-full mb-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" id="edit-textarea-${comment.id}">${comment.content}</textarea>
              <button type="button" class="px-4 py-2 bg-primary-700 text-white dark:text-white rounded hover:bg-primary-800" onclick="commentSystem.saveEdit(${comment.id})">
                Lưu
              </button>
              <button type="button" class="ml-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500" onclick="commentSystem.hideEditForm(${comment.id})">
                Huỷ
              </button>
            </div>
          `
              : ""
          }
        </article>
      `;
    } else {
      // Parent comment template
      return `
        <article class="p-6 mb-6 text-base bg-gray-50 rounded-lg dark:bg-gray-700" data-comment-id="${
          comment.id
        }">
          <footer class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <p class="inline-flex items-center mr-3 font-semibold text-sm text-gray-900 dark:text-white">
                ${comment.author.name}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <time pubdate datetime="${comment.createdAt}">
                  ${this.formatDate(comment.createdAt)}
                </time>
              </p>
            </div>

            ${
              canEdit
                ? `
              <div class="relative">
                <button type="button" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" onclick="commentSystem.toggleCommentMenu(${comment.id})">
                  <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 16 3">
                    <circle cx="2" cy="1.5" r="1.5" />
                    <circle cx="8" cy="1.5" r="1.5" />
                    <circle cx="14" cy="1.5" r="1.5" />
                  </svg>
                </button>
                <div id="cmt-menu-${comment.id}" class="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-700 rounded shadow-lg border border-gray-200 dark:border-gray-600 hidden z-10">
                  <ul class="py-1 text-sm text-gray-700 dark:text-gray-200">
                    <li>
                      <button type="button" class="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600" onclick="commentSystem.showEditForm(${comment.id})">
                        Chỉnh sửa
                      </button>
                    </li>
                    <li>
                      <button type="button" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400" onclick="commentSystem.deleteCommentHandler(${comment.id})">
                        Xoá
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            `
                : ""
            }
          </footer>

          <p class="text-gray-500 dark:text-gray-400" id="comment-content-${
            comment.id
          }">${comment.content}</p>

          ${
            canEdit
              ? `
            <div id="edit-form-${comment.id}" class="hidden mt-2">
              <textarea rows="3" class="border rounded w-full mb-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" id="edit-textarea-${comment.id}">${comment.content}</textarea>
              <button type="button" class="px-4 py-2 bg-primary-700 text-white dark:text-white rounded hover:bg-primary-800" onclick="commentSystem.saveEdit(${comment.id})">
                Lưu
              </button>
              <button type="button" class="ml-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500" onclick="commentSystem.hideEditForm(${comment.id})">
                Huỷ
              </button>
            </div>
          `
              : ""
          }

          <div class="flex items-center mt-4 space-x-4">
            <span class="flex items-center font-medium text-sm text-gray-500 dark:text-gray-400">
              <svg class="mr-1 w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                <path d="M17.947 2.053a5.209 5.209 0 0 0-3.793-1.53A6.414 6.414 0 0 0 10 2.311 6.482 6.482 0 0 0 5.824.5a5.2 5.2 0 0 0-3.8 1.521c-1.915 1.916-2.315 5.392.625 8.333l7 7a.5.5 0 0 0 .708 0l7-7a6.6 6.6 0 0 0 2.123-4.508 5.179 5.179 0 0 0-1.533-3.793Z"/>
              </svg>
              ${comment.children ? comment.children.length : 0} Reply
            </span>
            ${
              this.currentUser
                ? `
              <button type="button" class="px-3 py-1 text-xs font-medium bg-primary-600 text-white dark:text-white rounded hover:bg-primary-700 transition" onclick="window.commentSystem.toggleReplyForm(${comment.id})">
                Trả lời
              </button>
            `
                : ""
            }
          </div>

          ${
            this.currentUser
              ? `
            <div id="reply-form-${comment.id}" class="hidden mt-2">
              <textarea rows="2" class="border rounded px-2 py-1 text-sm w-full mb-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" id="reply-textarea-${comment.id}" placeholder="Nhập trả lời..."></textarea>
              <button type="button" class="px-4 py-2 text-xs font-medium bg-primary-700 text-white dark:text-white rounded-lg border border-primary-700 hover:bg-primary-800 focus:ring-2 focus:ring-primary-300 transition" onclick="window.commentSystem.submitReply(${comment.id})">
                Gửi reply
              </button>
            </div>
          `
              : ""
          }
        </article>
      `;
    }
  }

  renderComments() {
    const container = document.getElementById("comments-container");
    const loading = document.getElementById("loading-comments");
    const noComments = document.getElementById("no-comments");

    // Nếu trang không có khu vực bình luận thì bỏ qua
    if (!container) return;

    if (this.comments.length === 0) {
      if (loading) loading.classList.add("hidden");
      if (noComments) noComments.classList.remove("hidden");
      container.innerHTML = "";
      return;
    }

    if (loading) loading.classList.add("hidden");
    if (noComments) noComments.classList.add("hidden");

    let html = "";
    this.comments.forEach((comment) => {
      // Render parent comment
      html += this.createCommentHTML(comment, false);

      // Render reply comments directly after parent
      if (comment.children && comment.children.length > 0) {
        comment.children.forEach((reply) => {
          html += this.createCommentHTML(reply, true);
        });
      }
    });

    container.innerHTML = html;
  }

  // Event handlers
  async submitComment() {
    const textarea = document.getElementById("new-comment");
    const content = textarea.value.trim();

    if (!content) {
      alert("Vui lòng nhập nội dung bình luận");
      return;
    }

    if (!this.currentUser) {
      alert("Vui lòng đăng nhập để bình luận");
      return;
    }

    // Optimistic UI: thêm tạm thời trước khi server phản hồi
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: this.currentUser?.id,
        name: this.currentUser?.name || this.currentUser?.email || "Bạn",
        email: this.currentUser?.email || "",
      },
      parentId: null,
      children: [],
    };

    this.comments.unshift(optimisticComment);
    this.renderComments();
    textarea.value = "";

    try {
      const result = await this.createComment(content);
      // thay thế comment tạm bằng comment thật từ server
      const idx = this.comments.findIndex((c) => c.id === tempId);
      if (idx !== -1) {
        this.comments[idx] = result.comment;
      } else {
        // fallback: thêm nếu không tìm thấy
        this.comments.unshift(result.comment);
      }
      this.renderComments();
      this.showSuccessMessage("Bình luận đã được đăng thành công!");
    } catch (error) {
      // hoàn tác optimistic nếu lỗi
      this.comments = this.comments.filter((c) => c.id !== tempId);
      this.renderComments();
      this.showErrorMessage("Không thể đăng bình luận. Vui lòng thử lại.");
    }
  }

  async submitReply(parentId) {
    const textarea = document.getElementById(`reply-textarea-${parentId}`);
    const content = textarea.value.trim();

    if (!content) {
      alert("Vui lòng nhập nội dung trả lời");
      return;
    }

    // Optimistic UI cho reply
    const tempId = `temp-${Date.now()}`;
    const optimisticReply = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: this.currentUser?.id,
        name: this.currentUser?.name || this.currentUser?.email || "Bạn",
        email: this.currentUser?.email || "",
      },
      parentId,
    };

    const parentComment = this.comments.find((c) => c.id === parentId);
    if (parentComment) {
      if (!parentComment.children) parentComment.children = [];
      parentComment.children.push(optimisticReply);
    }
    this.renderComments();
    textarea.value = "";
    this.toggleReplyForm(parentId);

    try {
      const result = await this.createComment(content, parentId);
      // thay thế reply tạm
      const p = this.comments.find((c) => c.id === parentId);
      if (p && p.children) {
        const idx = p.children.findIndex((r) => r.id === tempId);
        if (idx !== -1) {
          p.children[idx] = result.comment;
        } else {
          p.children.push(result.comment);
        }
      }
      this.renderComments();
      this.showSuccessMessage("Trả lời đã được đăng thành công!");
    } catch (error) {
      // hoàn tác optimistic nếu lỗi
      const p = this.comments.find((c) => c.id === parentId);
      if (p && p.children) {
        p.children = p.children.filter((r) => r.id !== tempId);
      }
      this.renderComments();
      this.showErrorMessage("Không thể đăng trả lời. Vui lòng thử lại.");
    }
  }

  async deleteCommentHandler(commentId) {
    if (!confirm("Bạn chắc chắn muốn xóa bình luận này?")) {
      return;
    }

    try {
      await this.deleteComment(commentId);
      // Xóa comment khỏi array
      this.comments = this.comments.filter((c) => c.id !== commentId);
      this.comments.forEach((c) => {
        if (c.children) {
          c.children = c.children.filter((child) => child.id !== commentId);
        }
      });
      this.renderComments();
      this.showSuccessMessage("Bình luận đã được xóa thành công!");
    } catch (error) {
      this.showErrorMessage("Không thể xóa bình luận. Vui lòng thử lại.");
    }
  }

  async saveEdit(commentId) {
    const textarea = document.getElementById(`edit-textarea-${commentId}`);
    const content = textarea.value.trim();

    if (!content) {
      alert("Vui lòng nhập nội dung");
      return;
    }

    try {
      const result = await this.updateComment(commentId, content);
      // Cập nhật comment trong array
      const comment = this.comments.find((c) => c.id === commentId);
      if (comment) {
        comment.content = content;
      }
      this.comments.forEach((c) => {
        if (c.children) {
          const reply = c.children.find((child) => child.id === commentId);
          if (reply) {
            reply.content = content;
          }
        }
      });
      this.renderComments();
      this.showSuccessMessage("Bình luận đã được cập nhật thành công!");
    } catch (error) {
      this.showErrorMessage("Không thể cập nhật bình luận. Vui lòng thử lại.");
    }
  }

  // UI helper functions
  toggleCommentMenu(commentId) {
    const menu = document.getElementById(`cmt-menu-${commentId}`);
    menu.classList.toggle("hidden");
  }

  showEditForm(commentId) {
    const form = document.getElementById(`edit-form-${commentId}`);
    form.classList.remove("hidden");
    this.toggleCommentMenu(commentId);
  }

  hideEditForm(commentId) {
    const form = document.getElementById(`edit-form-${commentId}`);
    form.classList.add("hidden");
  }

  toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    form.classList.toggle("hidden");
  }

  showSuccessMessage(message) {
    // Tạo toast notification
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  showErrorMessage(message) {
    // Tạo toast notification
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Load comments on page load
  async loadComments() {
    try {
      // Nếu trang hiện tại không có container bình luận thì không gọi API
      if (!document.getElementById("comments-container")) {
        return;
      }
      const response = await fetch(
        `${this.apiBase}/${this.currentPostSlug}/comments`
      );
      if (response.ok) {
        const data = await response.json();
        this.comments = data.comments || [];
        this.renderComments();
      }
    } catch (error) {
      console.error("Lỗi tải comments:", error);
      const loading = document.getElementById("loading-comments");
      if (loading) {
        loading.innerHTML = '<p class="text-red-500">Lỗi tải bình luận</p>';
      }
    }
  }

  bindEvents() {
    // Bind submit comment button
    const submitBtn = document.getElementById("submit-comment");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => this.submitComment());
    }

    // Bind enter key for new comment
    const newCommentTextarea = document.getElementById("new-comment");
    if (newCommentTextarea) {
      newCommentTextarea.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
          this.submitComment();
        }
      });
    }
  }

  // Hiển thị thông báo lỗi authentication
  showAuthError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-md";
    errorDiv.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-600">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);

    // Tự động xóa sau 5 giây
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }

  // Hiển thị thông báo lỗi thông thường
  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className =
      "fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50 max-w-md";
    errorDiv.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button onclick="this.parentElement.parentElement.remove()" class="text-yellow-400 hover:text-yellow-600">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);

    // Tự động xóa sau 3 giây
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 3000);
  }
}

// Global instance for easy access
let commentSystem = null;
