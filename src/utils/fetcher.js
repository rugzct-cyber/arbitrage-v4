async function httpGet(url, options = {}) {
    try {
        const res = await fetch(url, { method: "GET", ...options });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error(`[FETCHER] Error fetching ${url}:`, error.message);
        return null;
    }
}
async function httpPost(url, body = {}) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error(`[FETCHER] Error posting to ${url}:`, error.message);
        return null;
    }
}
module.exports = { httpGet, httpPost };
