// ------------------ js/main.js ------------------

// 自动完成及添加行逻辑

function setupAutocomplete(inputSelector, autocompleteSelector, dataArray, addCallback) {
    const inputEl = document.querySelector(inputSelector);
    const autoList = document.querySelector(autocompleteSelector);
    document.body.appendChild(autoList);
    let isComposing = false;
    inputEl.addEventListener('compositionstart', () => {
        isComposing = true;
    });
    inputEl.addEventListener('compositionend', () => {
        isComposing = false;
        updateAutocomplete();
    });
    inputEl.addEventListener('input', () => {
        if (!isComposing) updateAutocomplete();
    });

    function updateAutocomplete() {
        const query = inputEl.value.trim().toLowerCase();
        autoList.innerHTML = '';
        if (query === '') {
            autoList.style.display = 'none';
            return;
        }
        const matches = dataArray.filter(item =>
            item.code.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)
        );
        if (matches.length === 0) {
            autoList.style.display = 'none';
            return;
        }
        matches.forEach(item => {
            const li = document.createElement('li');
            li.className = 'autocomplete-item';
            li.textContent = `${item.code} - ${item.name}`;
            li.addEventListener('click', () => {
                addCallback(item);
                inputEl.value = '';
                autoList.innerHTML = '';
                autoList.style.display = 'none';
            });
            autoList.appendChild(li);
        });
        const rect = inputEl.getBoundingClientRect();
        autoList.style.top = (rect.bottom + window.scrollY) + "px";
        autoList.style.left = (rect.left + window.scrollX) + "px";
        autoList.style.width = rect.width + "px";
        autoList.style.zIndex = 10000;
        autoList.style.display = 'block';
    }

    document.addEventListener('click', (e) => {
        if (!inputEl.contains(e.target) && !autoList.contains(e.target)) {
            autoList.style.display = 'none';
        }
    });

    window.addEventListener('scroll', () => {
        if (autoList.style.display === 'block') {
            const rect = inputEl.getBoundingClientRect();
            autoList.style.top = (rect.bottom + window.scrollY) + "px";
            autoList.style.left = (rect.left + window.scrollX) + "px";
        }
    });

    window.addEventListener('resize', () => {
        if (autoList.style.display === 'block') {
            const rect = inputEl.getBoundingClientRect();
            autoList.style.top = (rect.bottom + window.scrollY) + "px";
            autoList.style.left = (rect.left + window.scrollX) + "px";
            autoList.style.width = rect.width + "px";
        }
    });
}

function addDiagnosis(item) {
    const tbody = document.querySelector('#diagnosisTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td>${item.code}</td>
    <td>${item.name}</td>
    <td class="text-center">
      <input type="radio" name="primaryDiagnosis" value="${item.code}">
    </td>
    <td>
      <button type="button" class="btn btn-danger btn-sm delete-diagnosis">删除</button>
    </td>
  `;
    tbody.appendChild(tr);
    if (tbody.rows.length === 1) {
        tr.querySelector('input[type="radio"]').checked = true;
    }
    tr.querySelector('.delete-diagnosis').addEventListener('click', function () {
        const radio = tr.querySelector('input[type="radio"]');
        const wasChecked = radio.checked;
        tr.remove();
        if (wasChecked && tbody.rows.length > 0) {
            tbody.rows[0].querySelector('input[type="radio"]').checked = true;
        }
    });
}

function addSurgery(item) {
    const tbody = document.querySelector('#surgeryTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td>${item.code}</td>
    <td>${item.name}</td>
    <td class="text-center">
      <input type="checkbox" name="primarySurgery" value="${item.code}">
    </td>
    <td>
      <button type="button" class="btn btn-danger btn-sm delete-surgery">删除</button>
    </td>
  `;
    tbody.appendChild(tr);
    if (tbody.rows.length === 1) {
        tr.querySelector('input[type="checkbox"]').checked = true;
    }
    tr.querySelector('.delete-surgery').addEventListener('click', function () {
        const checkbox = tr.querySelector('input[type="checkbox"]');
        const wasChecked = checkbox.checked;
        tr.remove();
        if (wasChecked && tbody.rows.length > 0) {
            tbody.rows[0].querySelector('input[type="checkbox"]').checked = true;
        }
    });
}

setupAutocomplete('.diagnosis-input', '#diagnosisAutocomplete', DIAGNOSIS_DATA, addDiagnosis);
setupAutocomplete('.surgery-input', '#surgeryAutocomplete', SURGERY_DATA, addSurgery);

function collectPageData() {
    const patientBox = document.querySelector('.fixed-box.mb-3');
    const inputs = patientBox.querySelectorAll('input.form-control');
    const selects = patientBox.querySelectorAll('select.form-select');
    const index = "web=======================";
    const gender = parseInt(selects[0].value);
    const age = parseInt(inputs[0].value);
    const ageDay = parseInt(inputs[1].value);
    const weight = parseInt(inputs[2].value);
    const inHospitalTime = parseInt(inputs[3].value);
    const leavingType = (selects[1].value.trim() === "非死亡") ? "1" : "2";
    const diagnosisRows = document.querySelectorAll('#diagnosisTable tbody tr');
    const zdList = Array.from(diagnosisRows).map(row => row.cells[0].textContent.trim()).join(',');
    const surgeryRows = document.querySelectorAll('#surgeryTable tbody tr');
    const ssList = Array.from(surgeryRows).filter(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        return checkbox && !checkbox.checked;
    }).map(row => row.cells[0].textContent.trim()).join(',');
    const ssMainList = Array.from(surgeryRows).filter(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        return checkbox && checkbox.checked;
    }).map(row => row.cells[0].textContent.trim()).join(',');

    return {
        "Index": index,
        "gender": gender,
        "age": age,
        "ageDay": ageDay,
        "weight": weight,
        "inHospitalTime": inHospitalTime,
        "leavingType": leavingType,
        "zdList": zdList,
        "ssMainList": ssMainList,
        "ssList": ssList
    };
}

function doDrgGrouping() {
    document.getElementById('resultCard').style.display = 'none';
    if (!isApiKeyValid()) {
        alert("当前存储的密钥无效，请重新输入！");
        const customKeyStatus = document.getElementById('customKeyStatus');
        customKeyStatus.textContent = '';
        return;
    }
    const payload = collectPageData();
    const apiKey = (typeof getApiKeyFromStorage === 'function') ? getApiKeyFromStorage() : "";
    console.log("提交的 payload:", payload);
    // Base64 编码后的 API 地址
    const encodedAPI = "aHR0cDovLzM5LjEwNi45Mi40OjUzNjcxL2FwaS9ncm91cC9kcmcv";
    // 解码 Base64 获取真实 API 地址
    const apiURL = atob(encodedAPI);
    fetch(apiURL, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                // 如果返回状态不为 200，则认为密钥无效
                clearApiKeyInStorage();      // 清除本地缓存的密钥
                updateActionButtonText();      // 更新按钮文字为“输入密钥”
                alert("缓存的密钥无效，请重新输入！");
                const customKeyStatus = document.getElementById('customKeyStatus');
                customKeyStatus.textContent = '';
                return
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('resultCard').style.display = 'block';
            document.getElementById('rate').textContent = data.chsdrg || '-';
            document.getElementById('avgFee').textContent = data.drg || '-';
            document.getElementById('profit').textContent = data.ccmcc || '-';
            document.getElementById('status').textContent = data.status || '-';
        })
        .catch(error => {
            // alert('调用接口出错', error);
            console.error('调用接口出错:', error);
        });
}

window.doDrgGrouping = doDrgGrouping;