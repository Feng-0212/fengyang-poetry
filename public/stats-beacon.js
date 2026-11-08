/* 诗藏家族 · 统一访问统计埋点（门户/墨韵阁/诗藏/Agent 四站通用）
   用法：任意站点引入 <script src="https://poetry-garden.poeagent.top/stats-beacon.js" async></script>
   行为：页面加载打一次 UV/PV，此后每 45 秒心跳一次（仅刷新在线状态） */
(function () {
  try {
    var host = location.hostname;
    var site =
      host === "poeagent.top" || host === "www.poeagent.top" ? "portal"
      : host.indexOf("shicang") === 0 ? "shicang"
      : host.indexOf("agent") === 0 ? "agent"
      : "moyun";
    var K = "shicang-vid";
    var vid = localStorage.getItem(K);
    if (!vid) {
      vid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { localStorage.setItem(K, vid); } catch (e) {}
    }
    var base = "https://poetry-garden.poeagent.top/api/stats/collect";
    function ping(hb) {
      var img = new Image();
      img.src = base + "?v=" + encodeURIComponent(vid) + "&s=" + site + (hb ? "&hb=1" : "") + "&r=" + Math.random();
    }
    ping(false);
    setInterval(function () { ping(true); }, 45000);
  } catch (e) { /* 统计不影响页面 */ }
})();
