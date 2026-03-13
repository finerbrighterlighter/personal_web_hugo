let originalTimezone = '';

function getTime(elementID, hour12) {

  const element = document.getElementById(elementID);
  if (!element) return;

  /* store timezone once */
  if (!originalTimezone) {
    originalTimezone = element.textContent.trim();
  }

  const now = new Date();

  const formatted = now.toLocaleTimeString("en-US", {
    timeZone: originalTimezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: hour12,
    timeZoneName: "short"
  });

  /* Example output: "3:23 PM ICT" */

  element.textContent = formatted;

}

function updateTime() {
  getTime("timezone", true);
}

updateTime();
setInterval(updateTime, 1000);
