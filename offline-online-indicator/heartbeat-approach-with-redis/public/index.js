const userId = 1; // Example user ID

function setHeartbeat() {
  console.log("okay");
  fetch("/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}
async function checkStatus() {
  const userIds = [1, 2, 3]; // Example user IDs to check
  const response = await fetch(`/status?userIds=${userIds.join(",")}`);
  const statuses = await response.json();

  let results = "<h3>Statuses:</h3>";
  userIds.forEach((id) => {
    results += `<p>User ${id}: ${statuses[id] ? "Online 🟢" : "Offline 🔴"}</p>`;
  });
  document.getElementById("results").innerHTML = results;
}

/*
 // Browser sending heartbeats while the tab is open
window.addEventListener('load', startHeartbeats);
 
  function startHeartbeats() {
            heartbeatInterval = setInterval(sendHeartbeat, 20000);
            sendHeartbeat(); // Initial heartbeat
 }
 */
