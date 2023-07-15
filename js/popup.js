document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('proxy-form');
  const proxyList = document.getElementById('proxy-list');
  const btnSave = document.getElementById('btn-save');
  const btnCollapse = document.getElementById('btn-collapse');
  const icon = btnCollapse.querySelector('span');
 
  // Use a third-party service to get the IP address
  ShowCurrentUserIpAddres();
  


  btnCollapse.addEventListener('click', function () {

    if (form.classList.contains("frm-visible")) {
      icon.classList.remove('fa-minus');
      icon.classList.add('fa-plus');
      form.classList.remove("frm-visible")

    } else {
      icon.classList.remove('fa-plus');
      icon.classList.add('fa-minus');
      form.classList.add("frm-visible")
    }

    form.classList.toggle('collapse');

  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const nameInput = document.getElementById('name');
    const ipInput = document.getElementById('ip');
    const portInput = document.getElementById('port');
    const bypassListInput = document.getElementById('bypass-list');
    const editIndexInput = document.getElementById('edit-index');

    const name = nameInput.value.trim();
    const ip = ipInput.value.trim();
    const port = portInput.value.trim();
    const bypassList = bypassListInput.value.trim();
    const editIndex = editIndexInput.value.trim();

    if (name && ip && port) {
      browser.storage.local.get('proxies', function (data) {
        const proxies = data.proxies || [];

        if (editIndex) {
          // Update existing proxy
          if (editIndex >= 0 && editIndex < proxies.length) {
            proxies[editIndex] = {
              name: name,
              ip: ip,
              port: port,
              bypassList: bypassList
            };
          }

          const isProxyConnected = isProxyConnectedToCurrent(proxies[editIndex]);
          if (isProxyConnected) {
            connectToProxy(proxies[editIndex]);
          }

        } else {
          // Add new proxy
          const newProxy = {
            name: name,
            ip: ip,
            port: port,
            bypassList: bypassList
          };
          proxies.push(newProxy);
        }

        browser.storage.local.set({ 'proxies': proxies }, function () {
          renderProxyList();
        });
        
        nameInput.value = '';
        ipInput.value = '';
        portInput.value = '';
        bypassListInput.value = '';
        editIndexInput.value = '';
        btnSave.textContent = 'Add Proxy';
        if (form.classList.contains('frm-visible')) {
          btnCollapse.click();
        }
      });
    }
  });

  function connectToProxy(proxy) {
    const bypassList = proxy.bypassList ? proxy.bypassList.split(',') : [];
    browser.proxy.settings.set({
      value: {
        mode: 'fixed_servers',
        rules: {
          singleProxy: {
            scheme: 'http',
            host: proxy.ip,
            port: parseInt(proxy.port)
          },
          bypassList: bypassList
        }
      },
      scope: 'regular'
    }, function () {
      renderProxyList();
    });
    ShowCurrentUserIpAddres();
  }

  function disconnectFromProxy() {
    browser.proxy.settings.clear({ scope: 'regular' }, function () {
      renderProxyList();
    });
    ShowCurrentUserIpAddres();
  }

function isProxyConnectedToCurrent(proxy) {
  // Retrieve the current browser proxy settings
  browser.proxy.settings.get({ incognito: false }, function (config) {
    if (
      config &&
      config.value &&
      config.value.mode === 'fixed_servers' &&
      config.value.rules &&
      config.value.rules.singleProxy &&
      config.value.rules.singleProxy.host === proxy.ip &&
      parseInt(config.value.rules.singleProxy.port) === parseInt(proxy.port)
    ) {
      return true;
    }
  });

  return false;
}
  function renderProxyList() {
    browser.storage.local.get('proxies', function (data) {
      const proxies = data.proxies || [];

      proxyList.innerHTML = '';

      proxies.forEach(function (proxy, index) {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.innerHTML = `
          <div class="d-flex justify-content-between align-items-center">
            <span>${proxy.name}</span>
            <div>
              <button class="btn btn-primary connect-btn">Connect</button>
              <button class="btn btn-danger delete-btn" title="Delete">
              <span class="icon-trash"/>
              </button>
              <button class="btn btn-secondary edit-btn" title="Edit">
              <span class="icon-edit"/>
              </button>
            </div>
          </div>
        `;

      
      
        const connectButton = listItem.querySelector('.connect-btn');
        const deleteButton = listItem.querySelector('.delete-btn');
        const editButton = listItem.querySelector('.edit-btn');

        connectButton.addEventListener('click', function () {
          if (connectButton.textContent === 'Connect') {
            disconnectFromProxy();
            connectToProxy(proxy);
          } else {
            disconnectFromProxy();
          }
        });

        browser.proxy.settings.get({ incognito: false }, function (config) {
          if (
            config &&
            config.value &&
            config.value.mode === 'fixed_servers' &&
            config.value.rules &&
            config.value.rules.singleProxy &&
            config.value.rules.singleProxy.host === proxy.ip &&
            parseInt(config.value.rules.singleProxy.port) === parseInt(proxy.port)
          ) {
            connectButton.classList.remove('btn-primary');
            connectButton.classList.add('btn-success');
            connectButton.textContent = 'Disconnect';
          }
        });

        deleteButton.addEventListener('click', function () {
          browser.storage.local.get('proxies', function (data) {
            const proxies = data.proxies || [];
            proxies.splice(index, 1);
            browser.storage.local.set({ 'proxies': proxies }, function () {
              renderProxyList();
            });
          });
        });

        editButton.addEventListener('click', function () {
          const nameInput = document.getElementById('name');
          const ipInput = document.getElementById('ip');
          const portInput = document.getElementById('port');
          const bypassListInput = document.getElementById('bypass-list');
          const editIndexInput = document.getElementById('edit-index');

          nameInput.value = proxy.name;
          ipInput.value = proxy.ip;
          portInput.value = proxy.port;
          bypassListInput.value = proxy.bypassList || '';
          editIndexInput.value = index;
          btnSave.textContent = 'Update Proxy';
          if (!form.classList.contains('show')) {
            btnCollapse.click();
          }
        });

        proxyList.appendChild(listItem);
      });
    });
  }

  renderProxyList();
});
function ShowCurrentUserIpAddres() {
  fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => {
      document.getElementById('ip-address').textContent = `Current Ip Address: ${data.ip}`;
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('ip-address').textContent = 'Failed to retrieve IP address.';
    });
}
