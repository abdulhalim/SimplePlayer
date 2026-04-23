/**
 * SimplePlayer - Editor Button with Media Browser
 * version 1.3
 */

(function () {
    'use strict';

    var modalClickBound = false;
    var mediaBrowserModal = null;
    var currentBrowserType = 'all'; // 'audio', 'image', 'all'
    var currentTargetInput = null; // The input field to fill
    var currentPath = '';

    function init() {
        var toolbar = document.getElementById('wmd-button-row');
        if (toolbar) {
            addButtonToToolbar(toolbar);
            return;
        }

        var observer = new MutationObserver(function () {
            var toolbar = document.getElementById('wmd-button-row');
            if (toolbar) {
                addButtonToToolbar(toolbar);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(function () {
            if (!document.getElementById('wmd-button-row')) {
                addButtonToSimpleEditor();
            }
        }, 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function addButtonToToolbar(toolbar) {
        if (document.getElementById('wmd-simpleplayer-button')) return;

        var li = document.createElement('li');
        li.className = 'wmd-button';
        li.id = 'wmd-simpleplayer-button';
        li.title = 'درج پخش‌کننده صوتی';

        var span = document.createElement('span');
        span.innerHTML = '<svg width="16" height="16" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path clip-rule="evenodd" d="M6.48542 18.6893L13.0821 25.1703C14.8862 26.9427 17.971 25.6874 17.971 23.1808V4.81925C17.971 2.3126 14.8862 1.05725 13.0821 2.82973L6.48542 9.31065H3.43958C2.09223 9.31065 1 10.3837 1 11.7074V16.2926C1 17.6163 2.09224 18.6893 3.43958 18.6893H6.48542ZM7.58159 16.8188L14.5821 23.6966C15.0499 24.1561 15.8496 23.8306 15.8496 23.1808V4.81925C15.8496 4.16938 15.0499 3.84392 14.5821 4.30345L7.58159 11.1812C7.44234 11.318 7.36412 11.5035 7.36412 11.697V16.303C7.36412 16.4965 7.44234 16.682 7.58159 16.8188ZM5.24275 11.3948H3.43958C3.26384 11.3948 3.12137 11.5348 3.12137 11.7074V16.2926C3.12137 16.4652 3.26384 16.6052 3.43958 16.6052H5.24275V11.3948Z" fill="#6c757d" fill-rule="evenodd"/><path d="M22.7437 22.3364C22.2813 21.9831 22.2015 21.3302 22.5283 20.8526C25.3157 16.7793 25.9181 11.5645 22.7053 7.69395C22.3351 7.24793 22.3295 6.59119 22.7437 6.18423C23.158 5.77727 23.835 5.77583 24.214 6.21465C28.3909 11.0506 27.4383 17.4771 24.2055 22.1342C23.8755 22.6097 23.2061 22.6898 22.7437 22.3364Z" fill="#6c757d"/><path d="M20.8216 13.6463C20.7817 12.5486 20.5055 11.6062 20.1251 10.9429C19.8376 10.4415 19.7402 9.77098 20.0917 9.31056C20.4431 8.85015 21.1179 8.75448 21.4848 9.20319C22.411 10.3362 22.884 11.9871 22.9416 13.5719C23.0032 15.266 22.6045 17.1437 21.5255 18.631C21.1855 19.0996 20.5059 19.0962 20.0917 18.6893C19.6774 18.2823 19.688 17.6242 19.9906 17.1314C20.5942 16.1482 20.867 14.897 20.8216 13.6463Z" fill="#6c757d"/></svg>';
        span.style.display = 'flex';
        span.style.alignItems = 'center';
        span.style.justifyContent = 'center';
        span.style.width = '100%';
        span.style.height = '100%';
        li.appendChild(span);

        // محاسبه موقعیت left
        var buttons = toolbar.querySelectorAll('li.wmd-button');
        var lastLeft = 0;
        if (buttons.length) {
            var lastButton = buttons[buttons.length - 1];
            var left = parseInt(lastButton.style.left, 10);
            if (!isNaN(left)) {
                lastLeft = left + 25;
            } else {
                for (var i = buttons.length - 1; i >= 0; i--) {
                    var btn = buttons[i];
                    var l = parseInt(btn.style.left, 10);
                    if (!isNaN(l)) {
                        lastLeft = l + 25;
                        break;
                    }
                }
            }
        }
        li.style.left = lastLeft + 'px';

        li.addEventListener('click', function (e) {
            e.preventDefault();
            openModal();
        });

        toolbar.appendChild(li);
    }

    function addButtonToSimpleEditor() {
        if (document.querySelector('.simpleplayer-simple-btn')) return;
        var textarea = document.getElementById('text');
        if (!textarea) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-xs simpleplayer-simple-btn';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; margin-left:5px;"><path clip-rule="evenodd" d="M6.48542 18.6893L13.0821 25.1703C14.8862 26.9427 17.971 25.6874 17.971 23.1808V4.81925C17.971 2.3126 14.8862 1.05725 13.0821 2.82973L6.48542 9.31065H3.43958C2.09223 9.31065 1 10.3837 1 11.7074V16.2926C1 17.6163 2.09224 18.6893 3.43958 18.6893H6.48542ZM7.58159 16.8188L14.5821 23.6966C15.0499 24.1561 15.8496 23.8306 15.8496 23.1808V4.81925C15.8496 4.16938 15.0499 3.84392 14.5821 4.30345L7.58159 11.1812C7.44234 11.318 7.36412 11.5035 7.36412 11.697V16.303C7.36412 16.4965 7.44234 16.682 7.58159 16.8188ZM5.24275 11.3948H3.43958C3.26384 11.3948 3.12137 11.5348 3.12137 11.7074V16.2926C3.12137 16.4652 3.26384 16.6052 3.43958 16.6052H5.24275V11.3948Z" fill="#6c757d" fill-rule="evenodd"/><path d="M22.7437 22.3364C22.2813 21.9831 22.2015 21.3302 22.5283 20.8526C25.3157 16.7793 25.9181 11.5645 22.7053 7.69395C22.3351 7.24793 22.3295 6.59119 22.7437 6.18423C23.158 5.77727 23.835 5.77583 24.214 6.21465C28.3909 11.0506 27.4383 17.4771 24.2055 22.1342C23.8755 22.6097 23.2061 22.6898 22.7437 22.3364Z" fill="#6c757d"/><path d="M20.8216 13.6463C20.7817 12.5486 20.5055 11.6062 20.1251 10.9429C19.8376 10.4415 19.7402 9.77098 20.0917 9.31056C20.4431 8.85015 21.1179 8.75448 21.4848 9.20319C22.411 10.3362 22.884 11.9871 22.9416 13.5719C23.0032 15.266 22.6045 17.1437 21.5255 18.631C21.1855 19.0996 20.5059 19.0962 20.0917 18.6893C19.6774 18.2823 19.688 17.6242 19.9906 17.1314C20.5942 16.1482 20.867 14.897 20.8216 13.6463Z" fill="#6c757d"/></svg> درج پخش‌کننده صوتی';
        btn.style.margin = '5px 0';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.gap = '5px';
        btn.addEventListener('click', openModal);
        textarea.parentNode.insertBefore(btn, textarea.nextSibling);
    }

    function openModal() {
        var modal = document.getElementById('simpleplayer-modal');
        if (modal) {
            modal.style.display = 'block';
            return;
        }

        modal = document.createElement('div');
        modal.id = 'simpleplayer-modal';
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.zIndex = '10000';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.4)';
        modal.style.direction = 'rtl';

        var content = document.createElement('div');
        content.style.backgroundColor = '#fff';
        content.style.margin = '5% auto';
        content.style.padding = '25px';
        content.style.width = '80%';
        content.style.maxWidth = '900px';
        content.style.borderRadius = '12px';
        content.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
        content.style.maxHeight = '80vh';
        content.style.overflowY = 'auto';

        var header = document.createElement('h3');
        header.textContent = 'درج پخش‌کننده صوتی';
        header.style.marginTop = '0';
        header.style.marginBottom = '20px';
        header.style.color = '#333';
        header.style.fontSize = '18px';
        header.style.borderBottom = '2px solid #b7daff';
        header.style.paddingBottom = '10px';
        content.appendChild(header);

        // توضیحات
        var desc = document.createElement('p');
        desc.innerHTML = 'اطلاعات هر آهنگ را وارد کنید. روی فیلد آدرس فایل کلیک کنید تا مرورگر مدیا باز شود.';
        desc.style.marginBottom = '15px';
        desc.style.color = '#666';
        desc.style.fontSize = '14px';
        desc.style.backgroundColor = '#f8f9fa';
        desc.style.padding = '10px';
        desc.style.borderRadius = '6px';
        desc.style.borderRight = '3px solid #b7daff';
        content.appendChild(desc);

        // لیست آهنگ‌ها
        var songsContainer = document.createElement('div');
        songsContainer.id = 'simpleplayer-songs-container';
        songsContainer.style.marginBottom = '20px';
        content.appendChild(songsContainer);

        // دکمه افزودن آهنگ جدید
        var addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.id = 'simpleplayer-add-song';
        addBtn.innerHTML = '+ افزودن آهنگ جدید';
        addBtn.style.backgroundColor = '#f0f0f0';
        addBtn.style.border = '1px dashed #b7daff';
        addBtn.style.borderRadius = '6px';
        addBtn.style.padding = '8px 15px';
        addBtn.style.cursor = 'pointer';
        addBtn.style.marginBottom = '20px';
        addBtn.style.color = '#333';
        addBtn.style.fontSize = '14px';
        addBtn.style.width = '100%';
        addBtn.style.textAlign = 'center';
        addBtn.addEventListener('click', function() {
            addSongRow(songsContainer);
        });
        content.appendChild(addBtn);

        // دکمه‌ها
        var buttonsDiv = document.createElement('div');
        buttonsDiv.style.marginTop = '25px';
        buttonsDiv.style.textAlign = 'center';

        var insertBtn = document.createElement('button');
        insertBtn.type = 'button';
        insertBtn.textContent = 'درج پخش‌کننده';
        insertBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        insertBtn.style.color = '#fff';
        insertBtn.style.border = 'none';
        insertBtn.style.borderRadius = '8px';
        insertBtn.style.padding = '12px 30px';
        insertBtn.style.cursor = 'pointer';
        insertBtn.style.fontWeight = '500';
        insertBtn.style.marginLeft = '15px';
        insertBtn.style.transition = 'all 0.3s ease';
        
        insertBtn.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });
        
        insertBtn.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });

        insertBtn.addEventListener('click', function () {
            var rows = songsContainer.querySelectorAll('.song-row');
            if (rows.length === 0) {
                alert('حداقل یک آهنگ وارد کنید.');
                return;
            }

            var songsData = [];
            var isValid = true;

            rows.forEach(function(row) {
                var url = row.querySelector('.song-url').value.trim();
                var title = row.querySelector('.song-title').value.trim();
                var artist = row.querySelector('.song-artist').value.trim();
                var cover = row.querySelector('.song-cover').value.trim();

                if (!url || !title || !artist) {
                    alert('لطفاً آدرس فایل، نام ترانه و نام خواننده را برای همه آهنگ‌ها وارد کنید.');
                    isValid = false;
                    return;
                }

                // بررسی اعتبار URL (ساده)
                if (!url.match(/^https?:\/\//i)) {
                    alert('آدرس فایل صوتی باید با http:// یا https:// شروع شود.');
                    isValid = false;
                    return;
                }

                if (cover && !cover.match(/^https?:\/\//i)) {
                    alert('آدرس تصویر باید با http:// یا https:// شروع شود.');
                    isValid = false;
                    return;
                }

                var songLine = url + '|' + title + '|' + artist;
                if (cover) {
                    songLine += '|' + cover;
                }
                songsData.push(songLine);
            });

            if (!isValid) return;

            // ساخت شورتکد ساده
            var shortcode = '[player]\n' + songsData.join('\n') + '\n[/player]';

            insertIntoEditor(shortcode);
            modal.style.display = 'none';
        });

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'انصراف';
        cancelBtn.style.backgroundColor = '#f5f5f5';
        cancelBtn.style.color = '#333';
        cancelBtn.style.border = '1px solid #e0e0e0';
        cancelBtn.style.borderRadius = '8px';
        cancelBtn.style.padding = '12px 30px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.transition = 'all 0.3s ease';
        
        cancelBtn.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#e8e8e8';
            this.style.transform = 'translateY(-1px)';
        });
        
        cancelBtn.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#f5f5f5';
            this.style.transform = 'translateY(0)';
        });

        cancelBtn.addEventListener('click', function () {
            modal.style.display = 'none';
        });

        buttonsDiv.appendChild(insertBtn);
        buttonsDiv.appendChild(cancelBtn);
        content.appendChild(buttonsDiv);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // افزودن اولین ردیف خالی
        addSongRow(songsContainer);

        if (!modalClickBound) {
            window.addEventListener('click', function (e) {
                var m = document.getElementById('simpleplayer-modal');
                if (m && e.target === m) {
                    m.style.display = 'none';
                }
            });
            modalClickBound = true;
        }
    }

    function addSongRow(container) {
        var row = document.createElement('div');
        row.className = 'song-row';
        row.style.display = 'flex';
        row.style.flexWrap = 'wrap';
        row.style.gap = '10px';
        row.style.marginBottom = '15px';
        row.style.padding = '15px';
        row.style.backgroundColor = '#f9f9f9';
        row.style.borderRadius = '8px';
        row.style.border = '1px solid #eaeaea';
        row.style.position = 'relative';

        // فیلد آدرس صوتی
        var urlDiv = document.createElement('div');
        urlDiv.style.flex = '2';
        urlDiv.style.minWidth = '200px';
        
        var urlLabel = document.createElement('label');
        urlLabel.textContent = 'آدرس فایل صوتی *';
        urlLabel.style.display = 'block';
        urlLabel.style.fontSize = '12px';
        urlLabel.style.marginBottom = '4px';
        urlLabel.style.color = '#555';
        
        var urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.className = 'song-url';
        urlInput.placeholder = 'کلیک کنید تا مرورگر مدیا باز شود...';
        urlInput.style.width = '100%';
        urlInput.style.padding = '8px';
        urlInput.style.border = '1px solid #ddd';
        urlInput.style.borderRadius = '4px';
        urlInput.style.boxSizing = 'border-box';
        urlInput.style.cursor = 'pointer';
        urlInput.style.backgroundColor = '#fff';
        urlInput.readOnly = true;
        
        urlInput.addEventListener('click', function() {
            openMediaBrowser('audio', urlInput);
        });
        
        urlDiv.appendChild(urlLabel);
        urlDiv.appendChild(urlInput);
        row.appendChild(urlDiv);

        // فیلد نام ترانه
        var titleDiv = document.createElement('div');
        titleDiv.style.flex = '1';
        titleDiv.style.minWidth = '120px';
        
        var titleLabel = document.createElement('label');
        titleLabel.textContent = 'نام ترانه *';
        titleLabel.style.display = 'block';
        titleLabel.style.fontSize = '12px';
        titleLabel.style.marginBottom = '4px';
        titleLabel.style.color = '#555';
        
        var titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'song-title';
        titleInput.placeholder = 'مثال: شب بی‌ستاره';
        titleInput.style.width = '100%';
        titleInput.style.padding = '8px';
        titleInput.style.border = '1px solid #ddd';
        titleInput.style.borderRadius = '4px';
        titleInput.style.boxSizing = 'border-box';
        
        titleDiv.appendChild(titleLabel);
        titleDiv.appendChild(titleInput);
        row.appendChild(titleDiv);

        // فیلد نام خواننده
        var artistDiv = document.createElement('div');
        artistDiv.style.flex = '1';
        artistDiv.style.minWidth = '120px';
        
        var artistLabel = document.createElement('label');
        artistLabel.textContent = 'نام خواننده *';
        artistLabel.style.display = 'block';
        artistLabel.style.fontSize = '12px';
        artistLabel.style.marginBottom = '4px';
        artistLabel.style.color = '#555';
        
        var artistInput = document.createElement('input');
        artistInput.type = 'text';
        artistInput.className = 'song-artist';
        artistInput.placeholder = 'مثال: علیرضا قربانی';
        artistInput.style.width = '100%';
        artistInput.style.padding = '8px';
        artistInput.style.border = '1px solid #ddd';
        artistInput.style.borderRadius = '4px';
        artistInput.style.boxSizing = 'border-box';
        
        artistDiv.appendChild(artistLabel);
        artistDiv.appendChild(artistInput);
        row.appendChild(artistDiv);

        // فیلد آدرس تصویر (اختیاری)
        var coverDiv = document.createElement('div');
        coverDiv.style.flex = '1.5';
        coverDiv.style.minWidth = '150px';
        
        var coverLabel = document.createElement('label');
        coverLabel.textContent = 'آدرس تصویر (اختیاری)';
        coverLabel.style.display = 'block';
        coverLabel.style.fontSize = '12px';
        coverLabel.style.marginBottom = '4px';
        coverLabel.style.color = '#555';
        
        var coverInput = document.createElement('input');
        coverInput.type = 'url';
        coverInput.className = 'song-cover';
        coverInput.placeholder = 'کلیک کنید تا مرورگر تصویر باز شود...';
        coverInput.style.width = '100%';
        coverInput.style.padding = '8px';
        coverInput.style.border = '1px solid #ddd';
        coverInput.style.borderRadius = '4px';
        coverInput.style.boxSizing = 'border-box';
        coverInput.style.cursor = 'pointer';
        coverInput.style.backgroundColor = '#fff';
        coverInput.readOnly = true;
        
        coverInput.addEventListener('click', function() {
            openMediaBrowser('image', coverInput);
        });
        
        coverDiv.appendChild(coverLabel);
        coverDiv.appendChild(coverInput);
        row.appendChild(coverDiv);

        // دکمه حذف ردیف
        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        removeBtn.title = 'حذف این آهنگ';
        removeBtn.style.position = 'absolute';
        removeBtn.style.left = '-10px';
        removeBtn.style.top = '-10px';
        removeBtn.style.width = '24px';
        removeBtn.style.height = '24px';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.backgroundColor = '#ff6b6b';
        removeBtn.style.color = '#fff';
        removeBtn.style.border = 'none';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.display = 'flex';
        removeBtn.style.alignItems = 'center';
        removeBtn.style.justifyContent = 'center';
        removeBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

        removeBtn.addEventListener('click', function() {
            if (container.children.length > 1) {
                row.remove();
            } else {
                alert('حداقل یک آهنگ باید وجود داشته باشد. برای افزودن آهنگ جدید از دکمه + استفاده کنید.');
            }
        });

        row.appendChild(removeBtn);
        container.appendChild(row);
    }

    /**
     * Open Media Browser Modal
     */
    function openMediaBrowser(type, targetInput) {
        currentBrowserType = type;
        currentTargetInput = targetInput;
        currentPath = '';
        
        // Create media browser modal if not exists
        if (!mediaBrowserModal) {
            createMediaBrowserModal();
        }
        
        // Update title based on type
        var titleEl = document.getElementById('sp-media-browser-title');
        if (titleEl) {
            titleEl.textContent = type === 'audio' ? 'انتخاب فایل صوتی' : 'انتخاب تصویر';
        }
        
        mediaBrowserModal.style.display = 'block';
        loadMediaFiles(currentPath);
    }

    /**
     * Create Media Browser Modal
     */
    function createMediaBrowserModal() {
        mediaBrowserModal = document.createElement('div');
        mediaBrowserModal.id = 'sp-media-browser-modal';
        mediaBrowserModal.style.cssText = 'display:none;position:fixed;z-index:10001;left:0;top:0;width:100%;height:100%;background-color:rgba(0,0,0,0.5);direction:rtl;';
        
        var content = document.createElement('div');
        content.style.cssText = 'background-color:#fff;margin:3% auto;padding:20px;width:90%;max-width:1000px;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:90vh;overflow:hidden;display:flex;flex-direction:column;';
        
        // Header
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #b7daff;';
        
        var title = document.createElement('h3');
        title.id = 'sp-media-browser-title';
        title.textContent = 'مرورگر مدیا';
        title.style.cssText = 'margin:0;color:#333;font-size:16px;';
        
        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        closeBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:5px;display:flex;align-items:center;justify-content:center;';
        closeBtn.addEventListener('click', function() {
            mediaBrowserModal.style.display = 'none';
        });
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        content.appendChild(header);
        
        // Breadcrumb
        var breadcrumb = document.createElement('div');
        breadcrumb.id = 'sp-media-breadcrumb';
        breadcrumb.style.cssText = 'display:flex;align-items:center;gap:5px;margin-bottom:15px;padding:8px 12px;background:#f5f5f5;border-radius:6px;font-size:13px;flex-wrap:wrap;';
        content.appendChild(breadcrumb);
        
        // Loading indicator
        var loading = document.createElement('div');
        loading.id = 'sp-media-loading';
        loading.style.cssText = 'text-align:center;padding:40px;color:#666;display:none;';
        loading.innerHTML = '<div style="display:inline-block;width:40px;height:40px;border:3px solid #e0e0e0;border-top-color:#b7daff;border-radius:50%;animation:sp-spin 1s linear infinite;"></div><p style="margin-top:10px;">در حال بارگذاری...</p>';
        content.appendChild(loading);
        
        // Files container
        var filesContainer = document.createElement('div');
        filesContainer.id = 'sp-media-files';
        filesContainer.style.cssText = 'flex:1;overflow-y:auto;min-height:300px;max-height:60vh;';
        content.appendChild(filesContainer);
        
        // Error message
        var errorDiv = document.createElement('div');
        errorDiv.id = 'sp-media-error';
        errorDiv.style.cssText = 'display:none;text-align:center;padding:20px;color:#dc3545;background:#ffe6e6;border-radius:8px;margin-top:10px;';
        content.appendChild(errorDiv);
        
        mediaBrowserModal.appendChild(content);
        document.body.appendChild(mediaBrowserModal);
        
        // Close on backdrop click
        mediaBrowserModal.addEventListener('click', function(e) {
            if (e.target === mediaBrowserModal) {
                mediaBrowserModal.style.display = 'none';
            }
        });
        
        // Add spin animation
        var style = document.createElement('style');
        style.textContent = '@keyframes sp-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    /**
     * Load media files from server
     */
    function loadMediaFiles(path) {
        var filesContainer = document.getElementById('sp-media-files');
        var loading = document.getElementById('sp-media-loading');
        var errorDiv = document.getElementById('sp-media-error');
        var breadcrumb = document.getElementById('sp-media-breadcrumb');
        
        // Show loading
        filesContainer.innerHTML = '';
        loading.style.display = 'block';
        errorDiv.style.display = 'none';
        
        // Get action URL from config (set by Plugin.php)
        var ajaxUrl;
        if (typeof SimplePlayerConfig !== 'undefined' && SimplePlayerConfig.ajaxUrl) {
            ajaxUrl = SimplePlayerConfig.ajaxUrl;
        } else {
            // Fallback - construct URL manually
            var scripts = document.getElementsByTagName('script');
            var pluginUrl = '';
            for (var i = 0; i < scripts.length; i++) {
                var src = scripts[i].src || '';
                if (src.indexOf('SimplePlayer/js/editor-button.js') > -1) {
                    pluginUrl = src.split('/js/editor-button.js')[0];
                    break;
                }
            }
            ajaxUrl = pluginUrl + '/ajax.php';
        }
        
        // Build URL
        var action = currentBrowserType === 'audio' ? 'list-audio' : 'list-images';
        var separator = ajaxUrl.indexOf('?') > -1 ? '&' : '?';
        var url = ajaxUrl + separator + 'do=' + action + '&path=' + encodeURIComponent(path || '');
        
        console.log('SimplePlayer: Loading from', url);
        
        fetch(url, {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(function(response) {
                console.log('SimplePlayer: Response status', response.status);
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.text();
            })
            .then(function(text) {
                console.log('SimplePlayer: Response text', text.substring(0, 500));
                
                // Check if response looks like HTML error
                if (text.indexOf('<!DOCTYPE') === 0 || text.indexOf('<pre>') === 0 || text.indexOf('<html') === 0 || text.indexOf('<b>Warning</b>') === 0 || text.indexOf('<b>Fatal error</b>') === 0) {
                    throw new Error('خطای سرور. لطفاً محتویات کنسول را بررسی کنید.');
                }
                
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', e);
                    console.log('Full response:', text);
                    throw new Error('پاسخ نامعتبر از سرور');
                }
            })
            .then(function(data) {
                loading.style.display = 'none';
                
                if (!data.ok) {
                    errorDiv.textContent = data.msg || 'خطا در بارگذاری فایل‌ها';
                    errorDiv.style.display = 'block';
                    return;
                }
                
                currentPath = data.currentPath || '';
                updateBreadcrumb(data.currentPath, data.parentPath);
                renderFiles(data.folders, data.files, data.parentPath);
            })
            .catch(function(error) {
                loading.style.display = 'none';
                errorDiv.innerHTML = '<strong>خطا:</strong> ' + error.message + 
                    '<br><br><small>URL: ' + url + '</small>' +
                    '<br><small>برای اطلاعات بیشتر، کنسول مرورگر را بررسی کنید.</small>';
                errorDiv.style.display = 'block';
                console.error('SimplePlayer Error:', error);
            });
    }

    /**
     * Update breadcrumb navigation
     */
    function updateBreadcrumb(currentPath, parentPath) {
        var breadcrumb = document.getElementById('sp-media-breadcrumb');
        breadcrumb.innerHTML = '';
        
        // Root link with SVG folder icon
        var rootLink = document.createElement('span');
        rootLink.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle; margin-left:5px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> فایل‌های من';
        rootLink.style.cssText = 'cursor:pointer;color:#667eea;font-weight:500;';
        rootLink.addEventListener('click', function() { loadMediaFiles(''); });
        breadcrumb.appendChild(rootLink);
        
        if (currentPath) {
            var parts = currentPath.split('/');
            var buildPath = '';
            
            parts.forEach(function(part, index) {
                buildPath += (buildPath ? '/' : '') + part;
                
                var separator = document.createElement('span');
                separator.textContent = ' / ';
                separator.style.color = '#999';
                breadcrumb.appendChild(separator);
                
                var link = document.createElement('span');
                link.textContent = part;
                link.style.cssText = 'cursor:pointer;color:#667eea;';
                
                (function(p) {
                    link.addEventListener('click', function() { loadMediaFiles(p); });
                })(buildPath);
                
                breadcrumb.appendChild(link);
            });
        }
    }

    /**
     * Render files and folders - Grid style like SimpleGallery
     */
    function renderFiles(folders, files, parentPath) {
        var container = document.getElementById('sp-media-files');
        container.innerHTML = '';

        if (folders.length === 0 && files.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="margin-bottom:10px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p>این پوشه خالی است</p></div>';
            return;
        }

        var grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill, minmax(100px, 1fr));gap:10px;padding:10px;';

        // Parent folder link
        if (parentPath !== undefined && currentPath !== '') {
            var parentItem = createFolderItem('..', parentPath, true);
            grid.appendChild(parentItem);
        }

        // Render folders
        folders.forEach(function(folder) {
            var item = createFolderItem(folder.name, folder.path, false);
            grid.appendChild(item);
        });

        // Render files
        files.forEach(function(file) {
            var item = createFileItem(file);
            grid.appendChild(item);
        });

        container.appendChild(grid);
    }

    /**
     * Create folder item element - SVG style like SimpleGallery
     */
    function createFolderItem(name, path, isParent) {
        var item = document.createElement('div');

        // تشخیص پوشه تاریخ (مثل 2025 یا 2025/01)
        var isDateFolder = /^\d{4}$/.test(name) || /^\d{2}$/.test(name) || isParent;

        item.style.cssText = 'cursor:pointer;position:relative;border-radius:6px;transition:all 0.2s;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;';

        // رنگ‌بندی متفاوت برای پوشه‌های تاریخ و معمولی
        if (isDateFolder) {
            item.style.backgroundColor = 'rgb(232, 244, 255)';
            item.style.border = '2px solid rgb(184, 212, 255)';
        } else {
            item.style.backgroundColor = '#f5f5f5';
            item.style.border = '2px solid #e0e0e0';
        }

        // SVG آیکون فولدر
        var icon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        item.innerHTML = '<div style="margin-bottom:6px;">' + icon + '</div>' +
                        '<div style="font-size:12px;color:#555;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90px;">' + name + '</div>';

        item.addEventListener('mouseenter', function() {
            if (isDateFolder) {
                this.style.backgroundColor = 'rgb(208, 232, 255)';
            } else {
                this.style.backgroundColor = '#e8e8e8';
            }
            this.style.transform = 'scale(1.02)';
        });

        item.addEventListener('mouseleave', function() {
            if (isDateFolder) {
                this.style.backgroundColor = 'rgb(232, 244, 255)';
            } else {
                this.style.backgroundColor = '#f5f5f5';
            }
            this.style.transform = 'scale(1)';
        });

        item.addEventListener('click', function() {
            loadMediaFiles(path);
        });

        return item;
    }

    /**
     * Create file item element - Square style like SimpleGallery
     */
    function createFileItem(file) {
        var item = document.createElement('div');
        item.style.cssText = 'cursor:pointer;position:relative;border-radius:6px;overflow:hidden;transition:all 0.2s;aspect-ratio:1;border:2px solid transparent;';

        var preview = '';
        if (file.type === 'image' && file.thumbnail) {
            preview = '<img src="' + file.thumbnail + '" style="width:100%;height:100%;object-fit:cover;" alt="' + file.name + '" />';
        } else if (file.type === 'audio') {
            preview = '<div style="width:100%;height:100%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/><polygon points="10,8 16,12 10,16" fill="white"/></svg></div>';
        }

        item.innerHTML = preview;

        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.borderColor = '#667eea';
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.borderColor = 'transparent';
        });

        item.addEventListener('click', function() {
            selectFile(file);
        });

        return item;
    }

    /**
     * Select file and fill input
     */
    function selectFile(file) {
        if (currentTargetInput) {
            currentTargetInput.value = file.url;
            
            // Visual feedback
            currentTargetInput.style.borderColor = '#28a745';
            currentTargetInput.style.backgroundColor = '#e8f5e9';
            
            setTimeout(function() {
                if (currentTargetInput) {
                    currentTargetInput.style.borderColor = '#ddd';
                    currentTargetInput.style.backgroundColor = '#fff';
                }
            }, 1000);
        }
        
        mediaBrowserModal.style.display = 'none';
    }

    function insertIntoEditor(text) {
        var textarea = document.getElementById('text');
        if (!textarea) return;

        if (window.wmd && wmd.CodeMirror) {
            var cm = wmd.CodeMirror;
            var doc = cm.getDoc();
            var cursor = doc.getCursor();
            doc.replaceRange(text, cursor);
        } else {
            insertAtCursor(textarea, text);
        }
    }

    function insertAtCursor(textarea, text) {
        if (textarea.selectionStart || textarea.selectionStart === 0) {
            var start = textarea.selectionStart;
            var end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
        } else {
            textarea.value += text;
        }
        textarea.focus();
        var ev = new Event('input', { bubbles: true });
        textarea.dispatchEvent(ev);
    }
})();
