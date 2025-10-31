// 存储所有包数据
let packages = [];
let zhCN = {};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('页面加载完成，开始初始化...');
  
  // 使用简单可靠的加载方式，避免缓存问题
  try {
    console.log('开始加载包数据 (go1.25-full.json)...');
    
    // 使用相对路径确保兼容性
    const pkgResponse = await fetch('./js/go1.25-full.json', {
      cache: 'reload',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`go1.25-full.json 请求状态: ${pkgResponse.status} ${pkgResponse.statusText}`);
    
    if (!pkgResponse.ok) {
      throw new Error(`加载go1.25-full.json失败: HTTP ${pkgResponse.status}`);
    }
    
    console.log('开始解析go1.25-full.json...');
    packages = await pkgResponse.json();
    
    if (!Array.isArray(packages)) {
      throw new Error('go1.25-full.json 解析结果不是数组格式');
    }
    
    console.log(`成功解析go1.25-full.json，共${packages.length}个包`);
    
    // 立即渲染一些示例数据，确保数据正确
    if (packages.length > 0) {
      console.log('示例包数据:', packages[0].name);
    }

    console.log('开始加载中文翻译 (zh-cn.json)...');
    const zhResponse = await fetch('./js/zh-cn.json', {
      cache: 'reload',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`zh-cn.json 请求状态: ${zhResponse.status} ${zhResponse.statusText}`);
    
    if (!zhResponse.ok) {
      throw new Error(`加载zh-cn.json失败: HTTP ${zhResponse.status}`);
    }
    
    console.log('开始解析zh-cn.json...');
    zhCN = await zhResponse.json();
    
    if (typeof zhCN !== 'object' || zhCN === null) {
      throw new Error('zh-cn.json 解析结果不是对象格式');
    }
    
    console.log(`成功解析zh-cn.json，共${Object.keys(zhCN).length}个翻译项`);
    
    // 显示一些示例翻译数据
    const sampleKeys = Object.keys(zhCN).slice(0, 3);
    console.log('示例翻译键:', sampleKeys);


    // 渲染包表格
    renderPackageTable(packages);

    // 绑定搜索事件
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // 返回按钮事件
    document.getElementById('backToTable').addEventListener('click', () => {
      document.getElementById('detailPanel').style.display = 'none';
      document.getElementById('packageListContainer').style.display = 'block';
    });

  } catch (error) {
    console.error('加载数据失败:', error);
    // 显示更详细的错误信息
    const errorMsg = `数据加载失败:\n\n` +
                    `错误类型: ${error.name}\n` +
                    `错误信息: ${error.message}\n` +
                    `\n请检查:\n` +
                    `1. JSON文件是否存在\n` +
                    `2. 文件路径是否正确\n` +
                    `3. JSON格式是否有效`;
    alert(errorMsg);
  }
});

// 处理搜索功能
function handleSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const searchResults = document.getElementById('searchResults');
  
  if (query.length === 0) {
    searchResults.style.display = 'none';
    renderPackageTable(packages);
    return;
  }
  
  // 过滤包
  const filtered = packages.filter(p => p.name.toLowerCase().includes(query));
  
  // 显示实时搜索结果
  searchResults.innerHTML = '';
  if (filtered.length > 0) {
    filtered.forEach(pkg => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.textContent = pkg.name;
      item.onclick = () => {
        showPackageDetail(pkg.name);
        searchResults.style.display = 'none';
        document.getElementById('searchInput').value = '';
      };
      searchResults.appendChild(item);
    });
    searchResults.style.display = 'block';
  } else {
    searchResults.innerHTML = '<div class="no-result">未找到相关包</div>';
    searchResults.style.display = 'block';
  }
  
  // 同时更新下方表格
  renderPackageTable(filtered);
}

// 点击页面其他地方关闭搜索结果
window.addEventListener('click', (e) => {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.style.display = 'none';
  }
});

// 渲染包列表表格
function renderPackageTable(pkgs) {
  const tbody = document.getElementById('packageList');
  tbody.innerHTML = '';

  if (pkgs.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.className = 'no-match';
    td.textContent = '未找到匹配的包';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  pkgs.forEach(pkg => {
    const tr = document.createElement('tr');

    const nameCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = pkg.name;
    link.onclick = (e) => {
      e.preventDefault();
      showPackageDetail(pkg.name);
    };
    nameCell.appendChild(link);

    const descCell = document.createElement('td');
    const chineseDesc = getChineseDescription(pkg.name);
    descCell.textContent = chineseDesc || pkg.desc || '暂无描述';

    tr.appendChild(nameCell);
    tr.appendChild(descCell);
    tbody.appendChild(tr);
  });
}

// 获取中文描述
function getChineseDescription(packageName) {
  if (!zhCN[packageName]) return '';
  
  // 从zhCN数据中提取描述，移除[zh]前缀
  let desc = zhCN[packageName].replace(/^\[zh\]/, '');
  
  // 提取第一行作为简短描述
  const lines = desc.split('\n');
  if (lines.length > 0) {
    // 移除包名前缀（如果有）
    return lines[0].replace(/^包\s*[^：]*：/, '').trim();
  }
  
  return desc.trim();
}

// 显示包详情
function showPackageDetail(importPath) {
  const panel = document.getElementById("detailPanel");
  const listContainer = document.getElementById("packageListContainer");
  
  // 从本地数据查找包
  const pkg = packages.find(p => p.name === importPath);
  
  if (!pkg) {
    console.error("未找到包:", importPath);
    alert("包详情暂不可用");
    return;
  }

  // 渲染详情
  renderPackageDetail(pkg);

  // 更新官方文档链接
  document.getElementById('officialLink').href = `https://pkg.go.dev/${pkg.name}@go1.25`;

  // 切换显示
  panel.style.display = "block";
  listContainer.style.display = "none";
  panel.scrollIntoView({ behavior: "smooth" });
}

// 渲染包详情内容
function renderPackageDetail(data) {
  // 包名
  document.getElementById("pkgTitle").textContent = `包：${data.name}`;

  // 获取中文描述
  const chineseDesc = zhCN[data.name] ? zhCN[data.name].replace(/^\[zh\]/, '') : '';

  // 概述（取中文描述的第一行）
  const pkgSynopsis = document.getElementById("pkgSynopsis");
  const lines = chineseDesc.split('\n');
  pkgSynopsis.textContent = lines.length > 0 ? lines[0].trim() : data.desc || '暂无描述';

  // 详细文档
  const pkgDoc = document.getElementById("pkgDoc");
  pkgDoc.innerHTML = chineseDesc ? formatDescription(chineseDesc) : (data.desc || '暂无详细描述');

  // 函数列表
  const funcsList = document.getElementById("pkgFuncs");
  if (data.functions && data.functions.length > 0) {
    funcsList.innerHTML = '';
    data.functions.forEach(func => {
      if (func.name && !func.name.startsWith('Test') && !func.name.startsWith('Benchmark') && !func.name.startsWith('Fuzz')) {
        const funcItem = document.createElement('div');
        funcItem.className = 'api-item';
        funcItem.innerHTML = `
          <div class="api-name">${func.name}</div>
          <div class="api-desc">${func.desc || '暂无描述'}</div>
        `;
        funcsList.appendChild(funcItem);
      }
    });
  } else {
    funcsList.innerHTML = '<div class="no-data">暂无导出函数</div>';
  }

  // 类型列表（预留，因为数据中可能没有完整的类型信息）
  const typesList = document.getElementById("pkgTypes");
  typesList.innerHTML = '<div class="no-data">类型信息待补充</div>';
}

// 格式化描述文本，处理换行等
function formatDescription(text) {
  return text
    .split('\n')
    .map(line => `<p>${line.trim()}</p>`)
    .join('');
}
