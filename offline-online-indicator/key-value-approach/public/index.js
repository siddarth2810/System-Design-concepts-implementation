// Function to fetch user presence from the backend
async function fetchPresence() {
  try {
    const response = await fetch("http://localhost:3000/api/presence");
    const users = await response.json();
    console.log(response);
    console.log(users);

    const container = document.getElementById("user-list");

    users.forEach((user) => {
      const userElement = document.createElement("div");
      userElement.textContent = `${user.name} is ${user.is_online ? "🟢" : "🔴"}`;
      container.appendChild(userElement);
    });
  } catch (error) {
    console.error("Error fetching users :", error);
  }
}

fetchPresence();

/* test query
INSERT INTO users (name, is_online) VALUES
('Alice', TRUE),
('Bob', FALSE),
('Charlie', TRUE),
('Diana', FALSE),
('Eve', TRUE),
('Frank', FALSE),
('Grace', TRUE),
('Hank', FALSE),
('Ivy', TRUE),
('Jack', FALSE);
*/
