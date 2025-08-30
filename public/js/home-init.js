// Home page initialization script
function initializeHomePage(userData) {
  console.log("🏠 Home page DOM loaded, initializing CommentSystem...");
  console.log("👤 User data:", userData);

  // Ensure CommentSystem class is available
  if (typeof CommentSystem === "undefined") {
    console.error(
      "❌ CommentSystem class not found. Make sure comment-system.js is loaded before home-init.js"
    );
    return;
  }

  try {
    // Initialize comment system
    const newCommentSystem = new CommentSystem({
      currentUser: userData,
      currentPostSlug: "home",
      apiBase: "/api/posts",
    });

    // Update both local and global references
    commentSystem = newCommentSystem;
    window.commentSystem = newCommentSystem;

    console.log("✅ CommentSystem initialized successfully");
    console.log("🔍 commentSystem object:", commentSystem);
    console.log("🔍 window.commentSystem:", window.commentSystem);
    console.log(
      "🔍 submitReply method available:",
      typeof commentSystem.submitReply
    );
    console.log(
      "🔍 toggleReplyForm method available:",
      typeof commentSystem.toggleReplyForm
    );
  } catch (error) {
    console.error("❌ Error initializing CommentSystem:", error);
  }

  // User dropdown functionality
  const userMenuButton = document.getElementById("user-menu-button");
  const userDropdown = document.getElementById("user-dropdown");

  console.log("🔍 Debug dropdown elements:", {
    userMenuButton: !!userMenuButton,
    userDropdown: !!userDropdown,
  });

  if (userMenuButton && userDropdown) {
    userMenuButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🖱️ User menu button clicked");
      userDropdown.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !userMenuButton.contains(e.target) &&
        !userDropdown.contains(e.target)
      ) {
        userDropdown.classList.add("hidden");
      }
    });
  } else {
    console.error("❌ User dropdown elements not found");
  }

  // Avatar modal functionality - Hashnode Style
  const changeAvatarBtn = document.getElementById("change-avatar-btn");
  const avatarModal = document.getElementById("avatar-modal");
  const closeAvatarModal = document.getElementById("close-avatar-modal");
  const cancelAvatarBtn = document.getElementById("cancel-avatar-btn");
  const selectAvatarBtn = document.getElementById("select-avatar-btn");
  const saveAvatarBtn = document.getElementById("save-avatar-btn");
  const avatarInput = document.getElementById("avatar-input");
  const avatarPreview = document.getElementById("avatar-preview");
  const avatarPlaceholder = document.getElementById("avatar-placeholder");

  let selectedFile = null;

  // Open modal when clicking "Thay đổi avatar"
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      avatarModal.classList.remove("hidden");
      // Close dropdown
      userDropdown.classList.add("hidden");
    });
  }

  // Close modal functions
  function closeModal() {
    avatarModal.classList.add("hidden");
    selectedFile = null;
    avatarInput.value = "";
    avatarPreview.classList.add("hidden");
    avatarPlaceholder.classList.remove("hidden");
    saveAvatarBtn.disabled = true;
  }

  if (closeAvatarModal) {
    closeAvatarModal.addEventListener("click", closeModal);
  }

  if (cancelAvatarBtn) {
    cancelAvatarBtn.addEventListener("click", closeModal);
  }

  // Close modal when clicking outside
  if (avatarModal) {
    avatarModal.addEventListener("click", (e) => {
      if (e.target === avatarModal) {
        closeModal();
      }
    });
  }

  // Select file button
  if (selectAvatarBtn) {
    selectAvatarBtn.addEventListener("click", () => {
      avatarInput.click();
    });
  }

  // Handle file selection
  if (avatarInput) {
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      selectedFile = file;

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview.src = e.target.result;
        avatarPreview.classList.remove("hidden");
        avatarPlaceholder.classList.add("hidden");
        saveAvatarBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    });
  }

  // Save avatar
  if (saveAvatarBtn) {
    saveAvatarBtn.addEventListener("click", async () => {
      if (!selectedFile) return;

      const formData = new FormData();
      formData.append("avatar", selectedFile);

      try {
        const response = await fetch("/api/upload-avatar", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();

          // Update avatar in UI
          const userMenuButton = document.getElementById("user-menu-button");
          if (userMenuButton) {
            userMenuButton.innerHTML = `
                 <span class="sr-only">Open user menu</span>
                 <img class="w-8 h-8 rounded-full" src="${result.avatar}" alt="User avatar">
               `;
            // Re-attach click event
            userMenuButton.addEventListener("click", () => {
              userDropdown.classList.toggle("hidden");
            });
          }

          // Close modal
          closeModal();

          console.log("Avatar updated successfully!");
        } else {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert(
          "Không thể tải avatar lên. Vui lòng thử lại. Lỗi: " + error.message
        );
      }
    });
  }
}
