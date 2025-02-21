const API_BASE_URL = "http://localhost:3000";

async function fetchUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    const users = await response.json();
    const usersTableBody = document.querySelector("#usersTable tbody");
    usersTableBody.innerHTML = ""; // Clear existing rows

    users.forEach((user) => {
      const row = document.createElement("tr");

      row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.bio ? user.bio : "<em>Bio deleted</em>"}</td>
                        <td>
                            <button class="delete" onclick="deleteUserBio(${user.id})">Delete Bio</button>
                        </td>
                    `;

      usersTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    alert("Failed to fetch users.");
  }
}

async function fetchBlogs() {
  try {
    const response = await fetch(`${API_BASE_URL}/blogs`);
    const blogs = await response.json();
    const blogsTableBody = document.querySelector("#blogsTable tbody");
    blogsTableBody.innerHTML = ""; // Clear existing rows

    blogs.forEach((blog) => {
      const row = document.createElement("tr");

      row.innerHTML = `
                        <td>${blog.id}</td>
                        <td>${blog.body}</td>
                        <td>
                            <button class="delete" onclick="deleteBlog(${blog.id})">Delete Blog</button>
                        </td>
                    `;

      blogsTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    alert("Failed to fetch blogs.");
  }
}

document
  .getElementById("createUserForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent form from submitting the traditional way

    const name = document.getElementById("userName").value.trim();
    const bio = document.getElementById("userBio").value.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, bio }),
      });

      if (response.ok) {
        alert("User created successfully!");
        document.getElementById("createUserForm").reset(); // Clear the form
        fetchUsers(); // Refresh the users list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user.");
    }
  });

document
  .getElementById("createBlogForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const body = document.getElementById("blogBody").value.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      if (response.ok) {
        alert("Blog created successfully!");
        document.getElementById("createBlogForm").reset(); // Clear the form
        fetchBlogs(); // Refresh the blogs list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      alert("Failed to create blog.");
    }
  });

async function deleteUserBio(userId) {
  if (!confirm("Are you sure you want to delete this user's bio?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/bio`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("User bio soft deleted successfully!");
      fetchUsers(); // Refresh the users list
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error deleting user bio:", error);
    alert("Failed to delete user bio.");
  }
}

async function deleteBlog(blogId) {
  if (!confirm("Are you sure you want to delete this blog?")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      alert("Blog soft deleted successfully!");
      fetchBlogs(); // Refresh the blogs list
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error deleting blog:", error);
    alert("Failed to delete blog.");
  }
}

/* Initial Fetching of Data */
window.onload = () => {
  fetchUsers();
  fetchBlogs();
};
