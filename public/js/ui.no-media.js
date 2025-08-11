/**
 * UI module that mirrors ./ui.js but renders results WITHOUT images/videos.
 * It keeps the same exported API so main.js works unchanged.
 */
import { dom, state } from './main.js';

// --- UI Update Helpers ---
export function showStatusMessage(message, isError = false) {
    dom.overallStatusDiv.innerHTML = message;
    dom.overallStatusDiv.style.display = 'block';
    if (isError) {
        dom.overallStatusDiv.style.backgroundColor = '#f8d7da';
        dom.overallStatusDiv.style.color = '#721c24';
    } else {
        dom.overallStatusDiv.style.backgroundColor = '#e2f0e8';
        dom.overallStatusDiv.style.color = '#218838';
    }
}

export function hideStatusMessages() {
    dom.overallStatusDiv.style.display = 'none';
    dom.multiUrlProgressDiv.style.display = 'none';
    dom.multiUrlProgressDiv.innerHTML = '';
}

export function updateUrlStatus(element, message, isError = false) {
    element.innerHTML = message;
    if (isError) {
        element.classList.add('error');
    } else {
        element.classList.remove('error');
    }
}

export function updateApiParams() {
    const selectedApi = dom.apiSelect.value;
    dom.apiParamsTextarea.value = state.defaultApiParams[selectedApi] || '{}';
}

// --- Result Rendering (TEXT-ONLY) ---
export async function displayResults(results, apiName) {
    dom.resultsDiv.innerHTML = '';
    dom.downloadAllBtn.style.display = 'none';

    if (results.length === 0) {
        dom.resultsDiv.textContent = 'Không tìm thấy kết quả nào.';
        return;
    }

    const renderMap = {
        'get_list_fb_user_photos': renderFbUserPhotosTextOnly,
        'get_list_fb_user_reels': renderFbUserReelsTextOnly,
        'get_list_ig_post': renderIgPostTextOnly,
        'get_list_ig_user_stories': renderIgUserStoriesTextOnly,
    };

    const renderFunction = renderMap[apiName] || renderGenericResultsTextOnly;
    await renderFunction(results);

    if (results.length > 0) {
        dom.downloadAllBtn.style.display = 'block';
    }
}

function textRow(label, value) {
    const safe = (v) => (v === null || v === undefined || v === '' ? 'N/A' : String(v));
    return `<div><b>${label}:</b> ${safe(value)}</div>`;
}

export async function fetchSavedList() {
    try {
        const resp = await fetch('http://localhost:3000/saved-list');
        const data = await resp.json();
        return data.list || [];
    } catch (e) {
        console.error("Error fetching saved list:", e);
        return [];
    }
}

async function renderFbUserPhotosTextOnly(results) {
    const savedList = await fetchSavedList();
    dom.resultsDiv.innerHTML = results.map(item => {
        if (!item) return '';
        const isSaved = savedList.some(e => e.username === item.username && e.id === item.id);
        return `
            <div class="result-item">
                ${textRow('User', item.username)}
                ${textRow('ID', item.id)}
                ${textRow('Caption', item.accessibility_caption || '(Không có chú thích)')}
                ${textRow('Original URL', item.originalUrl ? `<a href="${item.originalUrl}" target="_blank">${item.originalUrl}</a>` : '')}
                <span style="color:${isSaved ? 'green' : 'red'};font-weight:bold;">${isSaved ? 'Đã lưu' : 'Chưa lưu'}</span>
            </div>
        `;
    }).join('');
}

function renderFbUserReelsTextOnly(results) {
    dom.resultsDiv.innerHTML = results.map(item => {
        if (!item) return '';
        return `
            <div class="result-item">
                ${textRow('User', item.username)}
                ${textRow('Reel ID', item.id)}
                ${textRow('Title', item.title || '(Không có tiêu đề)')}
                ${textRow('Views', item.view_count ?? 'N/A')}
                ${textRow('Original URL', item.originalUrl ? `<a href="${item.originalUrl}" target="_blank">${item.originalUrl}</a>` : '')}
            </div>
        `;
    }).join('');
}

async function renderIgPostTextOnly(results) {
    const savedList = await fetchSavedList();
    dom.resultsDiv.innerHTML = `<div style="display:flex;gap:20px;flex-wrap:wrap;">` +
        results.map(item => {
            const isSaved = savedList.some(e => e.username === item.username && e.id === item.id);
            const date = item.created_at ? new Date(item.created_at * 1000) : null;
            const formattedDate = date ? date.toLocaleString() : 'N/A';
            return `
                <div class="result-item" style="flex-direction:column;align-items:flex-start;min-width:220px;max-width:420px;">
                    ${textRow('User', item.username)}
                    ${textRow('Post ID', item.post_id || item.id)}
                    ${textRow('Caption', item.caption || '(No caption)')}
                    ${textRow('Created', formattedDate)}
                    ${textRow('Likes', item.like_count ?? 'N/A')}
                    ${textRow('Comments', item.comment_count ?? 'N/A')}
                    ${textRow('Original URL', item.originalUrl ? `<a href="${item.originalUrl}" target="_blank">${item.originalUrl}</a>` : '')}
                    <span style="color:${isSaved ? 'green' : 'red'};font-weight:bold;">${isSaved ? 'Đã tải về' : 'Chưa tải'}</span>
                </div>
            `;
        }).join('') + `</div>`;
}

async function renderIgUserStoriesTextOnly(results) {
    const savedList = await fetchSavedList();
    dom.resultsDiv.innerHTML = `<div style="display:flex;gap:20px;flex-wrap:wrap;">` +
        results.map(item => {
            const isSaved = savedList.some(e => e.username === item.username && e.id === item.id);
            const date = item.taken_at ? new Date(item.taken_at) : null;
            const expDate = item.expiring_at ? new Date(item.expiring_at) : null;
            return `
                <div class="result-item" style="flex-direction:column;align-items:flex-start;min-width:220px;max-width:420px;">
                    ${textRow('User', item.username)}
                    ${textRow('Story ID', item.id || item.pk)}
                    ${textRow('Thời gian đăng', date ? date.toLocaleString() : 'N/A')}
                    ${textRow('Hết hạn', expDate ? expDate.toLocaleString() : 'N/A')}
                    ${textRow('Thời lượng video', item.video_duration ? item.video_duration + 's' : 'N/A')}
                    ${textRow('Nhạc', item.music || '(Không có)')}
                    ${textRow('Original URL', item.originalUrl ? `<a href="${item.originalUrl}" target="_blank">${item.originalUrl}</a>` : '')}
                    <span style="color:${isSaved ? 'green' : 'red'};font-weight:bold;">${isSaved ? 'Đã tải về' : 'Chưa tải'}</span>
                </div>
            `;
        }).join('') + `</div>`;
}

function renderGenericResultsTextOnly(results) {
    dom.resultsDiv.innerHTML = results.map(item => `
        <div class="result-item">
            <pre>${JSON.stringify(item, null, 2)}</pre>
        </div>
    `).join('');
}

// --- Modal (unchanged) ---
export function showNearestLocationModal({ username, cursor, pagesLoaded }) {
    return new Promise((resolve) => {
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'nearest-location-modal-overlay';
        Object.assign(modalOverlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.4)', zIndex: '9999', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        });

        const modalBox = document.createElement('div');
        Object.assign(modalBox.style, {
            background: '#fff', padding: '32px 24px', borderRadius: '10px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)', minWidth: '320px',
            maxWidth: '90vw', textAlign: 'center'
        });

        modalBox.innerHTML = `
            <h2 style="margin-bottom:18px;">Resume from last location?</h2>
            <div style="margin-bottom:10px;"><b>User name:</b> ${username}</div>
            <div style="margin-bottom:10px;"><b>Total number of pages:</b> ${pagesLoaded}</div>
            <div style="margin-bottom:18px;"><b>Last cursor:</b> <span style="word-break:break-all;">${cursor || '(none)'}</span></div>
            <div style="margin-bottom:18px;">
                <input type="checkbox" id="modalNearestCheckbox">
                <label for="modalNearestCheckbox" style="font-weight:normal;">Get from nearest location</label>
            </div>
            <button id="modalConfirmBtn" style="margin-right:10px;">OK</button>
        `;

        modalOverlay.appendChild(modalBox);
        document.body.appendChild(modalOverlay);

        document.getElementById('modalConfirmBtn').onclick = () => {
            const checked = document.getElementById('modalNearestCheckbox').checked;
            document.body.removeChild(modalOverlay);
            resolve(checked);
        };
    });
}
