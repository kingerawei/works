// ------------------ js/check.js ------------------

// 本地密钥管理常量及函数
const LOCAL_STORAGE_KEY = 'apiKey';

function getApiKeyFromStorage() {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
}

function setApiKeyToStorage(apiKey) {
    localStorage.setItem(LOCAL_STORAGE_KEY, apiKey);
}

function clearApiKeyInStorage() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
}

// 获取页面元素
const actionButton = document.getElementById('actionButton');
const apiKeyModal = document.getElementById('apiKeyModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const confirmKeyButton = document.getElementById('confirmKeyButton');
const keyStatus = document.getElementById('keyStatus');

// 如果使用 Bootstrap 的 Modal
let bootstrapModal = null;
if (typeof bootstrap !== 'undefined') {
    bootstrapModal = new bootstrap.Modal(apiKeyModal, {keyboard: false});
}

// 自定义弹窗相关函数（当未引入 Bootstrap JS 时使用）
function showCustomModal() {
    document.getElementById('customModalOverlay').style.display = 'block';
    document.getElementById('customModal').style.display = 'block';
}

function hideCustomModal() {
    document.getElementById('customModalOverlay').style.display = 'none';
    document.getElementById('customModal').style.display = 'none';
}

// 为验证密钥我们调用分组接口，构造一个测试 payload（请根据需要调整，确保不会产生副作用）
function getTestPayload() {
    return {
        "Index": "dummy",
        "gender": 1,
        "age": 20,
        "ageDay": 0,
        "weight": 0,
        "inHospitalTime": 10,
        "leavingType": "1",
        "zdList": "",
        "ssMainList": "",
        "ssList": ""
    };
}

// 用于自定义弹窗的“确定”按钮事件
function confirmCustomKey() {
    const customApiKeyInput = document.getElementById('customApiKeyInput');
    const customKeyStatus = document.getElementById('customKeyStatus');
    const userInputKey = customApiKeyInput.value.trim();
    if (!userInputKey) {
        alert("请输入有效的密钥。");
        return;
    }
    customKeyStatus.style.display = 'block';
    customKeyStatus.style.color = '#333';
    customKeyStatus.textContent = '正在验证，请稍候...';
    // Base64 编码后的 API 地址
    const encodedAPI = "aHR0cDovLzM5LjEwNi45Mi40OjUzNjcxL2FwaS9ncm91cC9kcmcv";
    // 解码 Base64 获取真实 API 地址
    const apiURL = atob(encodedAPI);
    // 调用已有接口验证密钥
    fetch(apiURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": userInputKey
        },
        body: JSON.stringify(getTestPayload())
    })
        .then(response => {
            if (response.ok) {
                setApiKeyToStorage(userInputKey);
                customKeyStatus.style.color = 'green';
                customKeyStatus.textContent = '密钥验证成功！正在启用模拟分组功能...';
                updateActionButtonText();
                setTimeout(() => {
                    hideCustomModal();
                }, 1000);
            } else {
                clearApiKeyInStorage();
                return response.json().then(err => {
                    throw new Error(err.detail || "密钥验证失败");
                });
            }
        })
        .catch(error => {
            console.error("验证出错：", error);
            customKeyStatus.style.color = 'red';
            customKeyStatus.textContent = error.message + "，请重新输入！";
        });
}

function updateActionButtonText() {
    if (isApiKeyValid()) {
        actionButton.textContent = "模拟分组";
    } else {
        actionButton.textContent = "输入密钥";
    }
}

updateActionButtonText();

// 主按钮点击事件
actionButton.addEventListener('click', function () {
    if (!isApiKeyValid()) {
        apiKeyInput.value = "";
        keyStatus.style.display = 'none';
        if (bootstrapModal) {
            bootstrapModal.show();
        } else {
            showCustomModal();
        }
    } else {
        if (typeof doDrgGrouping === 'function') {
            doDrgGrouping();
        } else {
            console.error("doDrgGrouping 函数不存在！");
        }
    }
});

// Bootstrap 模态框“确定”按钮事件
confirmKeyButton.addEventListener('click', function () {
    const userInputKey = apiKeyInput.value.trim();
    if (!userInputKey) {
        alert("请输入有效的密钥。");
        return;
    }
    keyStatus.style.display = 'block';
    keyStatus.style.color = '#333';
    keyStatus.textContent = '正在验证，请稍候...';

    // 调用已有接口验证密钥
    fetch("http://39.106.92.4:53671/api/group/drg/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": userInputKey
        },
        body: JSON.stringify(getTestPayload())
    })
        .then(response => {
            if (response.ok) {
                setApiKeyToStorage(userInputKey);
                keyStatus.style.color = 'green';
                keyStatus.textContent = '密钥验证成功！正在启用模拟分组功能...';
                updateActionButtonText();
                setTimeout(() => {
                    if (bootstrapModal) {
                        bootstrapModal.hide();
                    }
                }, 1000);
            } else {
                clearApiKeyInStorage();
                return response.json().then(err => {
                    throw new Error(err.detail || "密钥验证失败");
                });
            }
        })
        .catch(error => {
            console.error("验证出错：", error);
            keyStatus.style.color = 'red';
            keyStatus.textContent = error.message + "，请重新输入！";
        });
});

// 检查是否有有效的 API 密钥
function isApiKeyValid() {
    const apiKey = getApiKeyFromStorage();
    return apiKey && apiKey.trim() !== '';
}