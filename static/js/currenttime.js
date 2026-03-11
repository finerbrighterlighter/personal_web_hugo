let originalTimezone = '';  // To store the original timezone

function getTime(elementID, format) {
  const element = document.getElementById(elementID);

  // If the original timezone hasn't been stored yet, do it now
  if (!originalTimezone) {
    originalTimezone = element.textContent.trim();  // Store the original timezone (e.g., "Asia/Bangkok")
  }

  const date = new Date();
  
  const options = {
    timeZone: originalTimezone,  // Use the original timezone stored
    timeZoneName: "long",
    hour12: format,
    hour: "numeric",
    minute: "numeric",
  };

  const formattedTime = date.toLocaleString("en-US", options);  // Example: "3:23 PM Indochina Time"
  
  // Split the formatted time and zone based on "M"
  const timeParts = formattedTime.split("M");
  element.textContent = timeParts[1] + " (" + timeParts[0] + "M)";  // Format: "Indochina Time (3:23 PM)"
}

function updateTime() {
  getTime("timezone", true);  // Pass 'true' for 12-hour format, 'false' for 24-hour format
}

setInterval(updateTime, 1000); // Refresh every second
