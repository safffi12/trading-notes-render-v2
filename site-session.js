(function () {
  const isNodeLocalServer =
    window.location.protocol === "http:" &&
    window.location.hostname === "localhost" &&
    window.location.port === "3000";

  if (!isNodeLocalServer) {
    return;
  }

  function sendHeartbeat() {
    fetch("/api/site-heartbeat", {
      method: "POST",
      keepalive: true
    }).catch(function () {});
  }

  function sendCloseSignal() {
    fetch("/api/site-close", {
      method: "POST",
      keepalive: true
    }).catch(function () {});
  }

  sendHeartbeat();

  const heartbeatTimer = window.setInterval(sendHeartbeat, 5000);

  window.addEventListener("beforeunload", function () {
    window.clearInterval(heartbeatTimer);
    sendCloseSignal();
  });
})();